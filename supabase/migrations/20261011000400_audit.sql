-- =============================================================================
-- BSBRA Digital Platform — 04 · Audit trail (Requirement 24)
-- Every insert, update and delete on a managed table is recorded with the
-- actor, their role, the time, the changed fields and before/after snapshots.
-- The log is append-only: no API role can modify or delete entries.
-- =============================================================================

create or replace function public.audit_record_label(data jsonb)
returns text
language sql
immutable
set search_path = ''
as $$
  select left(coalesce(
    data ->> 'title_en',
    data ->> 'name_en',
    data ->> 'vessel_name',
    data ->> 'company_name',
    data ->> 'full_name',
    data ->> 'email',
    case when data ? 'year' then 'Year ' || (data ->> 'year') end,
    case when data ? 'tide_date' then (data ->> 'tide_date') || ' ' || coalesce(data ->> 'tide_time', '') end,
    data ->> 'slug',
    data ->> 'id'
  ), 200);
$$;

create or replace function public.audit_trigger()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_old       jsonb;
  v_new       jsonb;
  v_changed   text[];
  v_actor     uuid := auth.uid();
  v_email     text;
  v_role      public.user_role;
begin
  if tg_op in ('UPDATE', 'DELETE') then
    v_old := to_jsonb(old);
  end if;
  if tg_op in ('INSERT', 'UPDATE') then
    v_new := to_jsonb(new);
  end if;

  if tg_op = 'UPDATE' then
    select array_agg(n.key order by n.key)
      into v_changed
      from jsonb_each(v_new) as n
     where n.value is distinct from (v_old -> n.key)
       and n.key not in ('updated_at', 'updated_by', 'last_sign_in_at');

    -- Nothing meaningful changed: do not write an entry.
    if v_changed is null then
      return new;
    end if;
  end if;

  if v_actor is not null then
    select p.email, p.role into v_email, v_role
      from public.profiles p
     where p.id = v_actor;
  end if;

  insert into public.audit_log (
    actor_id, actor_email, actor_role, action, table_name,
    record_id, record_label, changed_fields, old_data, new_data
  ) values (
    v_actor, v_email, v_role, lower(tg_op), tg_table_name,
    coalesce(v_new ->> 'id', v_old ->> 'id'),
    public.audit_record_label(coalesce(v_new, v_old)),
    v_changed, v_old, v_new
  );

  return coalesce(new, old);
end;
$$;

revoke execute on function public.audit_trigger() from public, anon, authenticated;

do $$
declare
  t text;
begin
  foreach t in array array[
    'yards', 'members', 'profiles', 'site_settings', 'pages', 'posts', 'documents',
    'meeting_minutes', 'committee_members', 'past_presidents', 'vessels',
    'industry_statistics', 'labour_statistics', 'tide_entries', 'compliance_items',
    'links', 'albums', 'photos'
  ] loop
    execute format('drop trigger if exists %I on public.%I', t || '_audit', t);
    execute format(
      'create trigger %I after insert or update or delete on public.%I
         for each row execute function public.audit_trigger()',
      t || '_audit', t);
  end loop;
end;
$$;

-- -----------------------------------------------------------------------------
-- Application activity (sign-in, exports, imports, downloads, invitations).
-- Callable by authenticated users only; the action list is fixed.
-- -----------------------------------------------------------------------------
create or replace function public.log_activity(
  p_action  text,
  p_target  text default null,
  p_details jsonb default '{}'::jsonb
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor uuid := auth.uid();
begin
  if v_actor is null then
    return;
  end if;

  if p_action not in ('sign_in', 'sign_out', 'export', 'import', 'download', 'invite', 'password_reset') then
    raise exception 'Unsupported activity: %', p_action using errcode = '22023';
  end if;

  if p_action = 'sign_in' then
    update public.profiles set last_sign_in_at = now() where id = v_actor;
  end if;

  insert into public.audit_log (actor_id, actor_email, actor_role, action, table_name, record_id, record_label, new_data)
  select v_actor, p.email, p.role, p_action, 'activity', p_target, left(p_target, 200),
         coalesce(p_details, '{}'::jsonb)
    from public.profiles p
   where p.id = v_actor;
end;
$$;

revoke execute on function public.log_activity(text, text, jsonb) from public, anon;
grant execute on function public.log_activity(text, text, jsonb) to authenticated;

-- -----------------------------------------------------------------------------
-- Document download counter. Counts only documents the caller may see.
-- -----------------------------------------------------------------------------
create or replace function public.record_document_download(p_document_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not exists (
    select 1 from public.documents d
     where d.id = p_document_id
       and (
         (d.status = 'published' and public.role_can_view(d.access_level, private.current_user_role()))
         or private.is_staff()
       )
  ) then
    return;
  end if;

  insert into public.document_stats (document_id, downloads, last_downloaded_at)
  values (p_document_id, 1, now())
  on conflict (document_id) do update
    set downloads = public.document_stats.downloads + 1,
        last_downloaded_at = now();
end;
$$;

grant execute on function public.record_document_download(uuid) to anon, authenticated;
