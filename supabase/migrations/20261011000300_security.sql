-- =============================================================================
-- BSBRA Digital Platform — 03 · Security
-- Role helpers, sign-up handling, profile guard and Row Level Security.
--
-- Permission matrix (enforced here, mirrored in src/lib/auth/permissions.ts):
--
--                          super_admin admin editor data_entry committee member corporate guest/anon
--   Read public content         ✓        ✓      ✓        ✓          ✓        ✓       ✓          ✓
--   Read corporate content      ✓        ✓      ✓        ✓          ✓        ✓       ✓
--   Read members content        ✓        ✓      ✓        ✓          ✓        ✓
--   Read internal content       ✓        ✓      ✓        ✓          ✓
--   Create / edit drafts        ✓        ✓      ✓        ✓
--   Publish, edit published     ✓        ✓      ✓
--   Delete content & data       ✓        ✓      ✓
--   Manage minutes              ✓        ✓
--   Messages                    ✓        ✓      ✓ (read/handle)
--   Users & roles               ✓        ✓ (not admins/super admins)
--   Audit log, site settings    ✓        ✓
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Role helpers. SECURITY DEFINER so policies can read profiles without
-- recursing into the profiles policies. Wrap calls as (select fn()) inside
-- policies so Postgres evaluates them once per statement, not once per row.
-- They live in the `private` schema, which the Data API does not expose: RLS
-- can call them, but they are not reachable as /rest/v1/rpc endpoints.
-- -----------------------------------------------------------------------------
create schema if not exists private;
grant usage on schema private to anon, authenticated, service_role;

create or replace function private.current_user_role()
returns public.user_role
language sql
stable
security definer
set search_path = ''
as $$
  select p.role
  from public.profiles p
  where p.id = auth.uid()
    and p.is_active;
$$;

create or replace function public.role_can_view(level public.access_level, r public.user_role)
returns boolean
language sql
immutable
parallel safe
set search_path = ''
as $$
  select case level
    when 'public' then true
    when 'corporate' then r in ('super_admin', 'admin', 'editor', 'data_entry', 'committee', 'member', 'corporate')
    when 'members' then r in ('super_admin', 'admin', 'editor', 'data_entry', 'committee', 'member')
    when 'internal' then r in ('super_admin', 'admin', 'editor', 'data_entry', 'committee')
    else false
  end is true;
$$;

create or replace function private.can_view(level public.access_level)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select public.role_can_view(level, private.current_user_role());
$$;

create or replace function private.is_staff()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(private.current_user_role() in ('super_admin', 'admin', 'editor', 'data_entry'), false);
$$;

create or replace function private.is_editor()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(private.current_user_role() in ('super_admin', 'admin', 'editor'), false);
$$;

create or replace function private.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(private.current_user_role() in ('super_admin', 'admin'), false);
$$;

create or replace function private.is_super_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(private.current_user_role() = 'super_admin', false);
$$;

-- -----------------------------------------------------------------------------
-- Sign-up: every new auth user gets a 'guest' profile. An administrator then
-- assigns the appropriate role. Bootstrap the first Controlling Authority from
-- the SQL Editor:
--   update public.profiles set role = 'super_admin' where email = 'you@example.org';
-- -----------------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, email, full_name, organization, designation, phone)
  values (
    new.id,
    new.email,
    nullif(trim(new.raw_user_meta_data ->> 'full_name'), ''),
    nullif(trim(new.raw_user_meta_data ->> 'organization'), ''),
    nullif(trim(new.raw_user_meta_data ->> 'designation'), ''),
    nullif(trim(new.raw_user_meta_data ->> 'phone'), '')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Keep the profile e-mail in step with the auth e-mail.
create or replace function public.handle_user_email_change()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.email is distinct from old.email then
    update public.profiles set email = new.email where id = new.id;
  end if;
  return new;
end;
$$;

drop trigger if exists on_auth_user_email_changed on auth.users;
create trigger on_auth_user_email_changed
  after update of email on auth.users
  for each row execute function public.handle_user_email_change();

-- -----------------------------------------------------------------------------
-- Profile guard: users may edit their own contact details, but only
-- administrators may change role, status or member link — and only a super
-- admin may grant, change or revoke administrator rights. Statements without
-- an auth context (SQL Editor, service role) are trusted.
-- -----------------------------------------------------------------------------
create or replace function public.profiles_guard()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor_role public.user_role := private.current_user_role();
begin
  if auth.uid() is null then
    return new;
  end if;

  if new.id is distinct from old.id or new.email is distinct from old.email then
    raise exception 'Profile id and e-mail cannot be changed here.' using errcode = '42501';
  end if;

  if actor_role = 'admin' and old.role = 'super_admin' and old.id <> auth.uid() then
    raise exception 'Only a super admin can modify a super admin account.' using errcode = '42501';
  end if;

  if new.role is distinct from old.role
     or new.is_active is distinct from old.is_active
     or new.member_id is distinct from old.member_id then

    if actor_role is null or actor_role not in ('super_admin', 'admin') then
      raise exception 'Only administrators can change roles or account status.' using errcode = '42501';
    end if;

    if new.id = auth.uid() then
      raise exception 'You cannot change your own role or account status.' using errcode = '42501';
    end if;

    if actor_role = 'admin'
       and (old.role in ('super_admin', 'admin') or new.role in ('super_admin', 'admin')) then
      raise exception 'Only a super admin can grant or revoke administrator roles.' using errcode = '42501';
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists profiles_guard on public.profiles;
create trigger profiles_guard before update on public.profiles
  for each row execute function public.profiles_guard();

-- Site settings record who changed them.
create or replace function public.stamp_settings_editor()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_by := coalesce(auth.uid(), new.updated_by);
  return new;
end;
$$;

drop trigger if exists site_settings_editor on public.site_settings;
create trigger site_settings_editor before update on public.site_settings
  for each row execute function public.stamp_settings_editor();


-- -----------------------------------------------------------------------------
-- Data API privileges. Row Level Security (below) decides which rows each role
-- can actually reach; these grants only expose the tables to the API roles.
-- -----------------------------------------------------------------------------
grant usage on schema public to anon, authenticated, service_role;
grant select, insert, update, delete on all tables in schema public to anon, authenticated;
grant all on all tables in schema public to service_role;
grant usage, select on all sequences in schema public to anon, authenticated, service_role;
grant execute on all functions in schema public to anon, authenticated, service_role;
-- Policies run as the caller, so API roles need EXECUTE on the private helpers.
grant execute on all functions in schema private to anon, authenticated, service_role;

-- -----------------------------------------------------------------------------
-- Row Level Security
-- -----------------------------------------------------------------------------

-- Editorial tables (status + access_level): pages, posts, documents.
-- Data-entry users work on drafts and items under review; publishing and
-- editing published items needs editor rights or above.
do $$
declare
  t text;
begin
  foreach t in array array['pages', 'posts', 'documents'] loop
    execute format('alter table public.%I enable row level security', t);

    execute format('drop policy if exists %I on public.%I', t || '_select', t);
    execute format($p$
      create policy %I on public.%I for select to anon, authenticated
      using (
        (status = 'published' and public.role_can_view(access_level, (select private.current_user_role())))
        or (select private.is_staff())
      )$p$, t || '_select', t);

    execute format('drop policy if exists %I on public.%I', t || '_insert', t);
    execute format($p$
      create policy %I on public.%I for insert to authenticated
      with check (
        (select private.is_editor())
        or ((select private.is_staff()) and status in ('draft', 'review'))
      )$p$, t || '_insert', t);

    execute format('drop policy if exists %I on public.%I', t || '_update', t);
    execute format($p$
      create policy %I on public.%I for update to authenticated
      using (
        (select private.is_editor())
        or ((select private.is_staff()) and status in ('draft', 'review'))
      )
      with check (
        (select private.is_editor())
        or ((select private.is_staff()) and status in ('draft', 'review'))
      )$p$, t || '_update', t);

    execute format('drop policy if exists %I on public.%I', t || '_delete', t);
    execute format($p$
      create policy %I on public.%I for delete to authenticated
      using ((select private.is_editor()))$p$, t || '_delete', t);
  end loop;
end;
$$;

-- Structured data tables with an is_published flag.
do $$
declare
  t text;
begin
  foreach t in array array[
    'yards', 'vessels', 'industry_statistics', 'labour_statistics',
    'committee_members', 'past_presidents', 'compliance_items', 'links', 'albums'
  ] loop
    execute format('alter table public.%I enable row level security', t);

    execute format('drop policy if exists %I on public.%I', t || '_select', t);
    execute format($p$
      create policy %I on public.%I for select to anon, authenticated
      using (is_published or (select private.is_staff()))$p$, t || '_select', t);

    execute format('drop policy if exists %I on public.%I', t || '_insert', t);
    execute format($p$
      create policy %I on public.%I for insert to authenticated
      with check ((select private.is_staff()))$p$, t || '_insert', t);

    execute format('drop policy if exists %I on public.%I', t || '_update', t);
    execute format($p$
      create policy %I on public.%I for update to authenticated
      using ((select private.is_staff()))
      with check ((select private.is_staff()))$p$, t || '_update', t);

    execute format('drop policy if exists %I on public.%I', t || '_delete', t);
    execute format($p$
      create policy %I on public.%I for delete to authenticated
      using ((select private.is_editor()))$p$, t || '_delete', t);
  end loop;
end;
$$;

-- Photos inherit visibility from their album.
alter table public.photos enable row level security;

drop policy if exists photos_select on public.photos;
create policy photos_select on public.photos for select to anon, authenticated
using (
  (select private.is_staff())
  or exists (select 1 from public.albums a where a.id = album_id and a.is_published)
);
drop policy if exists photos_insert on public.photos;
create policy photos_insert on public.photos for insert to authenticated
with check ((select private.is_staff()));
drop policy if exists photos_update on public.photos;
create policy photos_update on public.photos for update to authenticated
using ((select private.is_staff())) with check ((select private.is_staff()));
drop policy if exists photos_delete on public.photos;
create policy photos_delete on public.photos for delete to authenticated
using ((select private.is_editor()));

-- Tide tables are public reference data.
alter table public.tide_entries enable row level security;

drop policy if exists tide_entries_select on public.tide_entries;
create policy tide_entries_select on public.tide_entries for select to anon, authenticated
using (true);
drop policy if exists tide_entries_insert on public.tide_entries;
create policy tide_entries_insert on public.tide_entries for insert to authenticated
with check ((select private.is_staff()));
drop policy if exists tide_entries_update on public.tide_entries;
create policy tide_entries_update on public.tide_entries for update to authenticated
using ((select private.is_staff())) with check ((select private.is_staff()));
drop policy if exists tide_entries_delete on public.tide_entries;
create policy tide_entries_delete on public.tide_entries for delete to authenticated
using ((select private.is_editor()));

-- Member registry: visible to members, committee and staff.
alter table public.members enable row level security;

drop policy if exists members_select on public.members;
create policy members_select on public.members for select to authenticated
using ((select private.can_view('members')));
drop policy if exists members_insert on public.members;
create policy members_insert on public.members for insert to authenticated
with check ((select private.is_staff()));
drop policy if exists members_update on public.members;
create policy members_update on public.members for update to authenticated
using ((select private.is_staff())) with check ((select private.is_staff()));
drop policy if exists members_delete on public.members;
create policy members_delete on public.members for delete to authenticated
using ((select private.is_admin()));

-- Minutes: administrators manage; others read approved minutes their role allows.
alter table public.meeting_minutes enable row level security;

drop policy if exists meeting_minutes_select on public.meeting_minutes;
create policy meeting_minutes_select on public.meeting_minutes for select to authenticated
using (
  (select private.is_admin())
  or (status = 'approved' and public.role_can_view(access_level, (select private.current_user_role())))
);
drop policy if exists meeting_minutes_insert on public.meeting_minutes;
create policy meeting_minutes_insert on public.meeting_minutes for insert to authenticated
with check ((select private.is_admin()));
drop policy if exists meeting_minutes_update on public.meeting_minutes;
create policy meeting_minutes_update on public.meeting_minutes for update to authenticated
using ((select private.is_admin())) with check ((select private.is_admin()));
drop policy if exists meeting_minutes_delete on public.meeting_minutes;
create policy meeting_minutes_delete on public.meeting_minutes for delete to authenticated
using ((select private.is_admin()));

-- Profiles: own row, or administrators.
alter table public.profiles enable row level security;

drop policy if exists profiles_select on public.profiles;
create policy profiles_select on public.profiles for select to authenticated
using (id = (select auth.uid()) or (select private.is_admin()));
drop policy if exists profiles_update on public.profiles;
create policy profiles_update on public.profiles for update to authenticated
using (id = (select auth.uid()) or (select private.is_admin()))
with check (id = (select auth.uid()) or (select private.is_admin()));

-- Site settings: readable by all, editable by administrators.
alter table public.site_settings enable row level security;

drop policy if exists site_settings_select on public.site_settings;
create policy site_settings_select on public.site_settings for select to anon, authenticated
using (true);
drop policy if exists site_settings_update on public.site_settings;
create policy site_settings_update on public.site_settings for update to authenticated
using ((select private.is_admin())) with check ((select private.is_admin()));

-- Contact messages: anyone may submit; editors and above handle them.
alter table public.contact_messages enable row level security;

drop policy if exists contact_messages_insert on public.contact_messages;
create policy contact_messages_insert on public.contact_messages for insert to anon, authenticated
with check (status = 'new' and handled_by is null and handled_at is null);
drop policy if exists contact_messages_select on public.contact_messages;
create policy contact_messages_select on public.contact_messages for select to authenticated
using ((select private.is_editor()));
drop policy if exists contact_messages_update on public.contact_messages;
create policy contact_messages_update on public.contact_messages for update to authenticated
using ((select private.is_editor())) with check ((select private.is_editor()));
drop policy if exists contact_messages_delete on public.contact_messages;
create policy contact_messages_delete on public.contact_messages for delete to authenticated
using ((select private.is_admin()));

-- Download counters: public totals, written only through record_document_download().
alter table public.document_stats enable row level security;

drop policy if exists document_stats_select on public.document_stats;
create policy document_stats_select on public.document_stats for select to anon, authenticated
using (true);

-- Audit log: administrators read; nobody writes directly.
alter table public.audit_log enable row level security;

drop policy if exists audit_log_select on public.audit_log;
create policy audit_log_select on public.audit_log for select to authenticated
using ((select private.is_admin()));

revoke insert, update, delete, truncate on public.audit_log from anon, authenticated;
revoke insert, update, delete, truncate on public.document_stats from anon, authenticated;

-- -----------------------------------------------------------------------------
-- Function privileges: trigger functions are never callable over the API.
-- -----------------------------------------------------------------------------
revoke execute on function public.handle_new_user() from public, anon, authenticated;
revoke execute on function public.handle_user_email_change() from public, anon, authenticated;
revoke execute on function public.profiles_guard() from public, anon, authenticated;
