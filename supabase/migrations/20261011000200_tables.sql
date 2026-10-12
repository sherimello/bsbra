-- =============================================================================
-- BSBRA Digital Platform — 02 · Tables
-- Every managed table carries created_at/created_by/updated_at/updated_by,
-- maintained by public.set_row_meta(). Bilingual text uses *_en / *_bn pairs;
-- the application falls back to English when a Bangla value is empty.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Ship recycling yards (Requirement 7) — referenced by vessels and members
-- -----------------------------------------------------------------------------
create table if not exists public.yards (
  id                       uuid primary key default gen_random_uuid(),
  slug                     text not null unique check (public.is_valid_slug(slug)),
  name_en                  text not null check (char_length(name_en) between 2 and 200),
  name_bn                  text,
  status                   text not null default 'conventional'
                           check (status in ('green', 'progressive', 'conventional', 'inactive')),
  owner_company            text,
  address_en               text,
  address_bn               text,
  latitude                 numeric(9, 6) check (latitude between -90 and 90),
  longitude                numeric(9, 6) check (longitude between -180 and 180),
  contact_person           text,
  phone                    text,
  email                    text check (email is null or email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
  website                  text check (website is null or website ~* '^https?://'),
  show_contact             boolean not null default true,
  yard_area_sqm            numeric(12, 2) check (yard_area_sqm >= 0),
  capacity_ldt_per_year    numeric(14, 2) check (capacity_ldt_per_year >= 0),
  hkc_compliant            boolean not null default false,
  certifying_body          text,
  certificate_no           text,
  certificate_issued_on    date,
  certificate_expires_on   date,
  description_en           text,
  description_bn           text,
  facilities_en            text[] not null default '{}',
  facilities_bn            text[] not null default '{}',
  environmental_en         text[] not null default '{}',
  environmental_bn         text[] not null default '{}',
  safety_en                text[] not null default '{}',
  safety_bn                text[] not null default '{}',
  waste_en                 text[] not null default '{}',
  waste_bn                 text[] not null default '{}',
  cover_image              text,
  gallery                  text[] not null default '{}',
  sort_order               integer not null default 0,
  is_published             boolean not null default true,
  created_at               timestamptz not null default now(),
  created_by               uuid references auth.users (id) on delete set null,
  updated_at               timestamptz not null default now(),
  updated_by               uuid references auth.users (id) on delete set null,
  constraint yards_certificate_dates check (
    certificate_expires_on is null or certificate_issued_on is null
    or certificate_expires_on >= certificate_issued_on
  )
);
create index if not exists yards_status_idx on public.yards (status, sort_order);
create index if not exists yards_name_trgm_idx on public.yards using gin (name_en extensions.gin_trgm_ops);

-- -----------------------------------------------------------------------------
-- Member organisations (association registry; Requirement 25 "Members")
-- -----------------------------------------------------------------------------
create table if not exists public.members (
  id                          uuid primary key default gen_random_uuid(),
  membership_no               text unique,
  company_name                text not null check (char_length(company_name) between 2 and 200),
  company_name_bn             text,
  yard_id                     uuid references public.yards (id) on delete set null,
  representative_name         text,
  representative_designation  text,
  phone                       text,
  email                       text check (email is null or email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
  address                     text,
  website                     text check (website is null or website ~* '^https?://'),
  status                      text not null default 'active'
                              check (status in ('active', 'applicant', 'suspended', 'lapsed')),
  joined_on                   date,
  notes                       text,
  created_at                  timestamptz not null default now(),
  created_by                  uuid references auth.users (id) on delete set null,
  updated_at                  timestamptz not null default now(),
  updated_by                  uuid references auth.users (id) on delete set null
);
create index if not exists members_status_idx on public.members (status);
create index if not exists members_yard_idx on public.members (yard_id);

-- -----------------------------------------------------------------------------
-- User profiles — one row per auth user, created by a trigger on sign-up
-- -----------------------------------------------------------------------------
create table if not exists public.profiles (
  id               uuid primary key references auth.users (id) on delete cascade,
  email            text not null,
  full_name        text,
  organization     text,
  designation      text,
  phone            text,
  avatar_url       text,
  role             public.user_role not null default 'guest',
  is_active        boolean not null default true,
  member_id        uuid references public.members (id) on delete set null,
  last_sign_in_at  timestamptz,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);
create index if not exists profiles_role_idx on public.profiles (role);
create unique index if not exists profiles_email_idx on public.profiles (lower(email));
create index if not exists profiles_member_idx on public.profiles (member_id);

-- -----------------------------------------------------------------------------
-- Site settings — a single row holding organisation-wide configuration
-- -----------------------------------------------------------------------------
create table if not exists public.site_settings (
  id                    smallint primary key default 1 check (id = 1),
  org_name_en           text not null default 'Bangladesh Ship Breakers & Recyclers Association',
  org_name_bn           text not null default 'বাংলাদেশ শিপ ব্রেকার্স অ্যান্ড রিসাইক্লার্স অ্যাসোসিয়েশন',
  tagline_en            text,
  tagline_bn            text,
  address_en            text,
  address_bn            text,
  phone                 text,
  email                 text,
  office_hours_en       text,
  office_hours_bn       text,
  map_latitude          numeric(9, 6),
  map_longitude         numeric(9, 6),
  media_contact_name    text,
  media_contact_email   text,
  media_contact_phone   text,
  facebook_url          text,
  linkedin_url          text,
  youtube_url           text,
  x_url                 text,
  bsrb_url              text,
  announcement_en       text,
  announcement_bn       text,
  announcement_url      text,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now(),
  updated_by            uuid references auth.users (id) on delete set null
);

-- -----------------------------------------------------------------------------
-- CMS pages (About, Compliance, Waste, Safety, Labour, …). Body is Markdown;
-- level-2 headings (## …) become the page's animated sections.
-- -----------------------------------------------------------------------------
create table if not exists public.pages (
  id            uuid primary key default gen_random_uuid(),
  slug          text not null unique check (public.is_valid_slug(slug)),
  title_en      text not null check (char_length(title_en) between 1 and 200),
  title_bn      text,
  summary_en    text,
  summary_bn    text,
  body_en       text,
  body_bn       text,
  hero_image    text,
  sort_order    integer not null default 0,
  status        public.publish_status not null default 'draft',
  access_level  public.access_level not null default 'public',
  published_at  timestamptz,
  created_at    timestamptz not null default now(),
  created_by    uuid references auth.users (id) on delete set null,
  updated_at    timestamptz not null default now(),
  updated_by    uuid references auth.users (id) on delete set null
);

-- -----------------------------------------------------------------------------
-- Posts — news feed, announcements, press & media, international, CSR
-- -----------------------------------------------------------------------------
create table if not exists public.posts (
  id                  uuid primary key default gen_random_uuid(),
  slug                text not null unique check (public.is_valid_slug(slug)),
  type                public.post_type not null default 'news',
  title_en            text not null check (char_length(title_en) between 2 and 300),
  title_bn            text,
  excerpt_en          text check (excerpt_en is null or char_length(excerpt_en) <= 600),
  excerpt_bn          text,
  body_en             text,
  body_bn             text,
  cover_image         text,
  gallery             text[] not null default '{}',
  source_name         text,
  external_url        text check (external_url is null or external_url ~* '^https?://'),
  video_url           text check (video_url is null or video_url ~* '^https?://'),
  event_date          timestamptz,
  event_location_en   text,
  event_location_bn   text,
  csr_area            text check (csr_area is null or csr_area in (
                        'community', 'education', 'health', 'worker_welfare',
                        'local_support', 'environment', 'social')),
  tags                text[] not null default '{}',
  is_featured         boolean not null default false,
  status              public.publish_status not null default 'draft',
  access_level        public.access_level not null default 'public',
  published_at        timestamptz,
  created_at          timestamptz not null default now(),
  created_by          uuid references auth.users (id) on delete set null,
  updated_at          timestamptz not null default now(),
  updated_by          uuid references auth.users (id) on delete set null
);
create index if not exists posts_feed_idx on public.posts (status, type, published_at desc);
create index if not exists posts_featured_idx on public.posts (is_featured) where is_featured;
create index if not exists posts_title_trgm_idx on public.posts using gin (title_en extensions.gin_trgm_ops);

-- -----------------------------------------------------------------------------
-- Publications & downloads (Requirement 17)
-- -----------------------------------------------------------------------------
create table if not exists public.documents (
  id              uuid primary key default gen_random_uuid(),
  title_en        text not null check (char_length(title_en) between 2 and 300),
  title_bn        text,
  description_en  text,
  description_bn  text,
  category        text not null default 'publication' check (category in (
                    'publication', 'annual_report', 'industry_report', 'guideline',
                    'policy', 'circular', 'notice', 'form', 'research_paper',
                    'law_regulation', 'other')),
  year            integer check (year between 1960 and 2100),
  published_on    date,
  file_path       text,
  file_name       text,
  file_size       bigint check (file_size >= 0),
  mime_type       text,
  external_url    text check (external_url is null or external_url ~* '^https?://'),
  status          public.publish_status not null default 'draft',
  access_level    public.access_level not null default 'public',
  published_at    timestamptz,
  created_at      timestamptz not null default now(),
  created_by      uuid references auth.users (id) on delete set null,
  updated_at      timestamptz not null default now(),
  updated_by      uuid references auth.users (id) on delete set null,
  constraint documents_has_source check (file_path is not null or external_url is not null)
);
create index if not exists documents_catalog_idx on public.documents (status, category, year desc);
create index if not exists documents_title_trgm_idx on public.documents using gin (title_en extensions.gin_trgm_ops);

-- Download counters live apart from documents so that a download never
-- touches the audited document row.
create table if not exists public.document_stats (
  document_id  uuid primary key references public.documents (id) on delete cascade,
  downloads    bigint not null default 0,
  last_downloaded_at timestamptz
);

-- -----------------------------------------------------------------------------
-- Board / Executive Committee minutes (Requirement 19)
-- -----------------------------------------------------------------------------
create table if not exists public.meeting_minutes (
  id              uuid primary key default gen_random_uuid(),
  title_en        text not null check (char_length(title_en) between 2 and 300),
  title_bn        text,
  meeting_type    text not null default 'executive_committee' check (meeting_type in (
                    'board', 'executive_committee', 'general', 'special', 'sub_committee')),
  meeting_no      text,
  meeting_date    date not null,
  venue           text,
  summary_en      text,
  summary_bn      text,
  file_path       text,
  file_name       text,
  file_size       bigint check (file_size >= 0),
  mime_type       text,
  status          text not null default 'draft' check (status in ('draft', 'approved')),
  approved_at     timestamptz,
  access_level    public.access_level not null default 'internal',
  created_at      timestamptz not null default now(),
  created_by      uuid references auth.users (id) on delete set null,
  updated_at      timestamptz not null default now(),
  updated_by      uuid references auth.users (id) on delete set null
);
create index if not exists meeting_minutes_date_idx on public.meeting_minutes (meeting_date desc);

-- -----------------------------------------------------------------------------
-- Executive Committee & leadership (Requirement 4)
-- -----------------------------------------------------------------------------
create table if not exists public.committee_members (
  id               uuid primary key default gen_random_uuid(),
  name_en          text not null check (char_length(name_en) between 2 and 200),
  name_bn          text,
  designation_en   text not null,
  designation_bn   text,
  organization_en  text,
  organization_bn  text,
  category         text not null default 'office_bearer'
                   check (category in ('office_bearer', 'member', 'advisor')),
  term_label       text not null,
  is_current       boolean not null default true,
  photo            text,
  email            text check (email is null or email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
  phone            text,
  show_contact     boolean not null default false,
  bio_en           text,
  bio_bn           text,
  sort_order       integer not null default 0,
  is_published     boolean not null default true,
  created_at       timestamptz not null default now(),
  created_by       uuid references auth.users (id) on delete set null,
  updated_at       timestamptz not null default now(),
  updated_by       uuid references auth.users (id) on delete set null
);
create index if not exists committee_members_current_idx on public.committee_members (is_current, sort_order);

create table if not exists public.past_presidents (
  id               uuid primary key default gen_random_uuid(),
  name_en          text not null check (char_length(name_en) between 2 and 200),
  name_bn          text,
  term_start       integer check (term_start between 1960 and 2100),
  term_end         integer check (term_end between 1960 and 2100),
  organization_en  text,
  organization_bn  text,
  photo            text,
  bio_en           text,
  bio_bn           text,
  email            text check (email is null or email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
  show_contact     boolean not null default false,
  sort_order       integer not null default 0,
  is_published     boolean not null default true,
  created_at       timestamptz not null default now(),
  created_by       uuid references auth.users (id) on delete set null,
  updated_at       timestamptz not null default now(),
  updated_by       uuid references auth.users (id) on delete set null,
  constraint past_presidents_term check (term_end is null or term_start is null or term_end >= term_start)
);

-- -----------------------------------------------------------------------------
-- Yard-wise vessel database (Requirement 6)
-- -----------------------------------------------------------------------------
create table if not exists public.vessels (
  id                    uuid primary key default gen_random_uuid(),
  yard_id               uuid references public.yards (id) on delete set null,
  vessel_name           text not null check (char_length(vessel_name) between 1 and 200),
  former_names          text,
  imo_number            text check (imo_number is null or public.is_valid_imo(imo_number)),
  flag                  text,
  vessel_type           text not null default 'other' check (vessel_type in (
                          'bulk_carrier', 'oil_tanker', 'chemical_tanker', 'gas_carrier',
                          'container', 'general_cargo', 'ro_ro', 'passenger', 'reefer',
                          'offshore', 'tug', 'other')),
  ldt                   numeric(12, 2) check (ldt >= 0),
  gross_tonnage         numeric(12, 2) check (gross_tonnage >= 0),
  dwt                   numeric(12, 2) check (dwt >= 0),
  year_built            integer check (year_built between 1900 and 2100),
  arrival_date          date,
  beaching_date         date,
  cutting_started_on    date,
  cutting_completed_on  date,
  status                text not null default 'anchored'
                        check (status in ('anchored', 'beached', 'cutting', 'completed')),
  recycling_year        integer generated always as
                          (extract(year from coalesce(beaching_date, arrival_date))::integer) stored,
  ihm_available         boolean,
  noc_number            text,
  remarks               text,
  is_published          boolean not null default true,
  created_at            timestamptz not null default now(),
  created_by            uuid references auth.users (id) on delete set null,
  updated_at            timestamptz not null default now(),
  updated_by            uuid references auth.users (id) on delete set null,
  constraint vessels_beaching_after_arrival check (
    beaching_date is null or arrival_date is null or beaching_date >= arrival_date),
  constraint vessels_cutting_order check (
    cutting_completed_on is null or cutting_started_on is null
    or cutting_completed_on >= cutting_started_on)
);
create unique index if not exists vessels_imo_unique_idx on public.vessels (imo_number) where imo_number is not null;
create index if not exists vessels_yard_idx on public.vessels (yard_id);
create index if not exists vessels_year_idx on public.vessels (recycling_year desc);
create index if not exists vessels_type_idx on public.vessels (vessel_type);
create index if not exists vessels_name_trgm_idx on public.vessels using gin (vessel_name extensions.gin_trgm_ops);

-- -----------------------------------------------------------------------------
-- Industry statistics (Requirement 5) — official year-wise figures
-- -----------------------------------------------------------------------------
create table if not exists public.industry_statistics (
  id                    uuid primary key default gen_random_uuid(),
  year                  integer not null unique check (year between 1960 and 2100),
  vessels_recycled      integer check (vessels_recycled >= 0),
  vessels_beached       integer check (vessels_beached >= 0),
  total_ldt             numeric(14, 2) check (total_ldt >= 0),
  active_yards          integer check (active_yards >= 0),
  green_yards           integer check (green_yards >= 0),
  steel_output_tonnes   numeric(14, 2) check (steel_output_tonnes >= 0),
  workers_employed      integer check (workers_employed >= 0),
  global_share_percent  numeric(5, 2) check (global_share_percent between 0 and 100),
  notes_en              text,
  notes_bn              text,
  source                text,
  is_published          boolean not null default true,
  created_at            timestamptz not null default now(),
  created_by            uuid references auth.users (id) on delete set null,
  updated_at            timestamptz not null default now(),
  updated_by            uuid references auth.users (id) on delete set null
);

-- -----------------------------------------------------------------------------
-- Labour-related statistics (Requirement 12)
-- -----------------------------------------------------------------------------
create table if not exists public.labour_statistics (
  id                  uuid primary key default gen_random_uuid(),
  year                integer not null unique check (year between 1960 and 2100),
  workers_employed    integer check (workers_employed >= 0),
  workers_trained     integer check (workers_trained >= 0),
  training_sessions   integer check (training_sessions >= 0),
  health_checkups     integer check (health_checkups >= 0),
  insured_workers     integer check (insured_workers >= 0),
  welfare_programmes  integer check (welfare_programmes >= 0),
  notes_en            text,
  notes_bn            text,
  is_published        boolean not null default true,
  created_at          timestamptz not null default now(),
  created_by          uuid references auth.users (id) on delete set null,
  updated_at          timestamptz not null default now(),
  updated_by          uuid references auth.users (id) on delete set null
);

-- -----------------------------------------------------------------------------
-- Tide & beaching information (Requirement 11)
-- -----------------------------------------------------------------------------
create table if not exists public.tide_entries (
  id          uuid primary key default gen_random_uuid(),
  station     text not null default 'Sitakunda Coast',
  tide_date   date not null,
  tide_time   time not null,
  tide_type   text not null check (tide_type in ('high', 'low')),
  height_m    numeric(5, 2) not null check (height_m between -5 and 15),
  notes       text,
  created_at  timestamptz not null default now(),
  created_by  uuid references auth.users (id) on delete set null,
  updated_at  timestamptz not null default now(),
  updated_by  uuid references auth.users (id) on delete set null,
  constraint tide_entries_unique unique (station, tide_date, tide_time)
);
create index if not exists tide_entries_date_idx on public.tide_entries (tide_date);

-- -----------------------------------------------------------------------------
-- Green recycling, compliance, laws & conventions (Requirement 8)
-- -----------------------------------------------------------------------------
create table if not exists public.compliance_items (
  id              uuid primary key default gen_random_uuid(),
  category        text not null check (category in (
                    'green_facility', 'environmental', 'ship_recycling', 'ohs', 'waste',
                    'national_law', 'international_convention', 'initiative', 'our_compliance')),
  title_en        text not null check (char_length(title_en) between 2 and 300),
  title_bn        text,
  summary_en      text,
  summary_bn      text,
  body_en         text,
  body_bn         text,
  authority       text,
  reference_no    text,
  effective_date  date,
  reference_url   text check (reference_url is null or reference_url ~* '^https?://'),
  status          text not null default 'in_force' check (status in (
                    'in_force', 'adopted', 'in_progress', 'achieved', 'planned')),
  sort_order      integer not null default 0,
  is_published    boolean not null default true,
  created_at      timestamptz not null default now(),
  created_by      uuid references auth.users (id) on delete set null,
  updated_at      timestamptz not null default now(),
  updated_by      uuid references auth.users (id) on delete set null
);
create index if not exists compliance_items_category_idx on public.compliance_items (category, sort_order);

-- -----------------------------------------------------------------------------
-- Regulatory & important links (Requirement 20)
-- -----------------------------------------------------------------------------
create table if not exists public.links (
  id              uuid primary key default gen_random_uuid(),
  title_en        text not null check (char_length(title_en) between 2 and 200),
  title_bn        text,
  url             text not null check (url ~* '^https?://'),
  description_en  text,
  description_bn  text,
  category        text not null default 'institution' check (category in (
                    'government', 'regulatory', 'environmental', 'safety', 'international',
                    'ship_recycling', 'institution', 'association')),
  logo            text,
  is_featured     boolean not null default false,
  sort_order      integer not null default 0,
  is_published    boolean not null default true,
  created_at      timestamptz not null default now(),
  created_by      uuid references auth.users (id) on delete set null,
  updated_at      timestamptz not null default now(),
  updated_by      uuid references auth.users (id) on delete set null
);

-- -----------------------------------------------------------------------------
-- Photo gallery & media (Requirement 18)
-- -----------------------------------------------------------------------------
create table if not exists public.albums (
  id              uuid primary key default gen_random_uuid(),
  slug            text not null unique check (public.is_valid_slug(slug)),
  title_en        text not null check (char_length(title_en) between 2 and 200),
  title_bn        text,
  description_en  text,
  description_bn  text,
  category        text not null default 'events' check (category in (
                    'events', 'meetings', 'seminars', 'committee', 'yard_visits',
                    'green_yards', 'international', 'csr', 'operations')),
  event_date      date,
  cover_image     text,
  sort_order      integer not null default 0,
  is_published    boolean not null default true,
  created_at      timestamptz not null default now(),
  created_by      uuid references auth.users (id) on delete set null,
  updated_at      timestamptz not null default now(),
  updated_by      uuid references auth.users (id) on delete set null
);

create table if not exists public.photos (
  id              uuid primary key default gen_random_uuid(),
  album_id        uuid not null references public.albums (id) on delete cascade,
  image_path      text,
  video_url       text check (video_url is null or video_url ~* '^https?://'),
  caption_en      text,
  caption_bn      text,
  credit          text,
  width           integer check (width > 0),
  height          integer check (height > 0),
  allow_download  boolean not null default true,
  sort_order      integer not null default 0,
  created_at      timestamptz not null default now(),
  created_by      uuid references auth.users (id) on delete set null,
  updated_at      timestamptz not null default now(),
  updated_by      uuid references auth.users (id) on delete set null,
  constraint photos_has_media check (image_path is not null or video_url is not null)
);
create index if not exists photos_album_idx on public.photos (album_id, sort_order);

-- -----------------------------------------------------------------------------
-- Contact form submissions
-- -----------------------------------------------------------------------------
create table if not exists public.contact_messages (
  id            uuid primary key default gen_random_uuid(),
  name          text not null check (char_length(name) between 2 and 120),
  email         text not null check (char_length(email) <= 254 and email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
  phone         text check (phone is null or char_length(phone) <= 40),
  organization  text check (organization is null or char_length(organization) <= 200),
  subject       text check (subject is null or char_length(subject) <= 200),
  message       text not null check (char_length(message) between 10 and 5000),
  locale        text check (locale in ('en', 'bn')),
  status        text not null default 'new' check (status in ('new', 'read', 'replied', 'archived')),
  handled_by    uuid references auth.users (id) on delete set null,
  handled_at    timestamptz,
  created_at    timestamptz not null default now()
);
create index if not exists contact_messages_status_idx on public.contact_messages (status, created_at desc);

-- -----------------------------------------------------------------------------
-- Audit trail (Requirement 24) — append-only, written by triggers
-- -----------------------------------------------------------------------------
create table if not exists public.audit_log (
  id              bigint generated always as identity primary key,
  occurred_at     timestamptz not null default now(),
  actor_id        uuid references auth.users (id) on delete set null,
  actor_email     text,
  actor_role      public.user_role,
  action          text not null check (action in (
                    'insert', 'update', 'delete', 'sign_in', 'sign_out', 'export',
                    'import', 'download', 'invite', 'password_reset')),
  table_name      text not null,
  record_id       text,
  record_label    text,
  changed_fields  text[],
  old_data        jsonb,
  new_data        jsonb
);
create index if not exists audit_log_occurred_idx on public.audit_log (occurred_at desc);
create index if not exists audit_log_table_idx on public.audit_log (table_name, occurred_at desc);
create index if not exists audit_log_actor_idx on public.audit_log (actor_id, occurred_at desc);

-- -----------------------------------------------------------------------------
-- Row metadata triggers
-- -----------------------------------------------------------------------------
do $$
declare
  t text;
begin
  foreach t in array array[
    'yards', 'members', 'pages', 'posts', 'documents', 'meeting_minutes',
    'committee_members', 'past_presidents', 'vessels', 'industry_statistics',
    'labour_statistics', 'tide_entries', 'compliance_items', 'links', 'albums', 'photos'
  ] loop
    execute format('drop trigger if exists %I on public.%I', t || '_row_meta', t);
    execute format(
      'create trigger %I before insert or update on public.%I
         for each row execute function public.set_row_meta()',
      t || '_row_meta', t);
  end loop;

  foreach t in array array['pages', 'posts', 'documents'] loop
    execute format('drop trigger if exists %I on public.%I', t || '_published_at', t);
    execute format(
      'create trigger %I before insert or update on public.%I
         for each row execute function public.stamp_published_at()',
      t || '_published_at', t);
  end loop;
end;
$$;

drop trigger if exists profiles_touch on public.profiles;
create trigger profiles_touch before update on public.profiles
  for each row execute function public.touch_updated_at();

drop trigger if exists site_settings_touch on public.site_settings;
create trigger site_settings_touch before update on public.site_settings
  for each row execute function public.touch_updated_at();

-- Approving minutes stamps approved_at; returning to draft clears it.
create or replace function public.stamp_minutes_approval()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.status = 'approved' and new.approved_at is null then
    new.approved_at := now();
  elsif new.status = 'draft' then
    new.approved_at := null;
  end if;
  return new;
end;
$$;

drop trigger if exists meeting_minutes_approval on public.meeting_minutes;
create trigger meeting_minutes_approval before insert or update on public.meeting_minutes
  for each row execute function public.stamp_minutes_approval();

-- The settings row always exists so the site can read it on first boot.
insert into public.site_settings (id) values (1) on conflict (id) do nothing;
