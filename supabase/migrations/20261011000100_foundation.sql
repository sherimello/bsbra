-- =============================================================================
-- BSBRA Digital Platform — 01 · Foundation
-- Extensions, enumerated types and generic helper/trigger functions.
-- Run the migrations in filename order (Supabase CLI does this automatically:
-- `supabase db push`), or paste each file into the SQL Editor in order.
-- =============================================================================

create schema if not exists extensions;
create extension if not exists pgcrypto with schema extensions;
create extension if not exists pg_trgm  with schema extensions;

-- API roles resolve trigram functions (used by search) from this schema.
grant usage on schema extensions to anon, authenticated, service_role;

-- -----------------------------------------------------------------------------
-- Enumerated types
-- -----------------------------------------------------------------------------

-- Authority levels (Requirement 23). Ordered from most to least privileged.
--   super_admin  Controlling Authority — full control incl. administrators
--   admin        Administrator — manages everything except super admins
--   editor       Publishes, edits and deletes content and data
--   data_entry   Enters and updates information; cannot publish or delete
--   committee    Executive Committee — reads internal records & minutes
--   member       Registered BSBRA member — Members View
--   corporate    Corporate / institutional stakeholder — Corporate View
--   guest        Registered but not yet approved — Public View only
do $$
begin
  create type public.user_role as enum (
  'super_admin', 'admin', 'editor', 'data_entry',
  'committee', 'member', 'corporate', 'guest'
);
exception when duplicate_object then null;
end;
$$;

-- Who may see a record (Requirement 2).
--   public     everyone, including anonymous visitors
--   corporate  corporate users, members, committee and staff
--   members    members, committee and staff
--   internal   committee and staff only
do $$
begin
  create type public.access_level as enum ('public', 'corporate', 'members', 'internal');
exception when duplicate_object then null;
end;
$$;

-- Editorial workflow for pages, posts and documents.
do $$
begin
  create type public.publish_status as enum ('draft', 'review', 'published', 'archived');
exception when duplicate_object then null;
end;
$$;

-- News feed, press & media, international and CSR items (Requirements 13–16).
do $$
begin
  create type public.post_type as enum (
  'news', 'industry_update', 'activity', 'event', 'meeting', 'seminar',
  'workshop', 'announcement', 'press_release', 'media_coverage', 'tv_report',
  'statement', 'interview', 'international', 'csr'
);
exception when duplicate_object then null;
end;
$$;

-- -----------------------------------------------------------------------------
-- Generic trigger functions
-- -----------------------------------------------------------------------------

-- Keeps updated_at current on tables without authorship columns.
create or replace function public.touch_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

-- Maintains created_at / created_by / updated_at / updated_by. Authorship is
-- taken from the authenticated user and can never be spoofed by the client.
create or replace function public.set_row_meta()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if tg_op = 'INSERT' then
    new.created_at := coalesce(new.created_at, now());
    new.created_by := coalesce(auth.uid(), new.created_by);
    new.updated_at := now();
    new.updated_by := coalesce(auth.uid(), new.updated_by);
  else
    new.created_at := old.created_at;
    new.created_by := old.created_by;
    new.updated_at := now();
    new.updated_by := coalesce(auth.uid(), new.updated_by);
  end if;
  return new;
end;
$$;

-- Stamps published_at the first time a record is published.
create or replace function public.stamp_published_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.status = 'published' and new.published_at is null then
    new.published_at := now();
  end if;
  return new;
end;
$$;

-- -----------------------------------------------------------------------------
-- Domain helpers
-- -----------------------------------------------------------------------------

-- IMO ship identification number: 7 digits, the last being a check digit
-- computed as (d1*7 + d2*6 + d3*5 + d4*4 + d5*3 + d6*2) mod 10.
create or replace function public.is_valid_imo(imo text)
returns boolean
language sql
immutable
parallel safe
set search_path = ''
as $$
  select imo ~ '^[0-9]{7}$'
     and (
       substr(imo, 1, 1)::int * 7 +
       substr(imo, 2, 1)::int * 6 +
       substr(imo, 3, 1)::int * 5 +
       substr(imo, 4, 1)::int * 4 +
       substr(imo, 5, 1)::int * 3 +
       substr(imo, 6, 1)::int * 2
     ) % 10 = substr(imo, 7, 1)::int;
$$;

-- URL-safe slug validation shared by several tables.
create or replace function public.is_valid_slug(value text)
returns boolean
language sql
immutable
parallel safe
set search_path = ''
as $$
  select value ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$' and char_length(value) <= 120;
$$;
