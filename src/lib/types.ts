/**
 * Row types mirroring the Supabase schema in supabase/migrations.
 * Keep in step with the SQL; `npm run db:types` can generate a full
 * Database type once the project is linked to a Supabase instance.
 */

export type Role =
  | "super_admin"
  | "admin"
  | "editor"
  | "data_entry"
  | "committee"
  | "member"
  | "corporate"
  | "guest";

export type AccessLevel = "public" | "corporate" | "members" | "internal";
export type PublishStatus = "draft" | "review" | "published" | "archived";

export type PostType =
  | "news"
  | "industry_update"
  | "activity"
  | "event"
  | "meeting"
  | "seminar"
  | "workshop"
  | "announcement"
  | "press_release"
  | "media_coverage"
  | "tv_report"
  | "statement"
  | "interview"
  | "international"
  | "csr";

export type CsrArea =
  | "community"
  | "education"
  | "health"
  | "worker_welfare"
  | "local_support"
  | "environment"
  | "social";

export type YardStatus = "green" | "progressive" | "conventional" | "inactive";
export type VesselStatus = "anchored" | "beached" | "cutting" | "completed";
export type VesselType =
  | "bulk_carrier"
  | "oil_tanker"
  | "chemical_tanker"
  | "gas_carrier"
  | "container"
  | "general_cargo"
  | "ro_ro"
  | "passenger"
  | "reefer"
  | "offshore"
  | "tug"
  | "other";

export type DocumentCategory =
  | "publication"
  | "annual_report"
  | "industry_report"
  | "guideline"
  | "policy"
  | "circular"
  | "notice"
  | "form"
  | "research_paper"
  | "law_regulation"
  | "other";

export type ComplianceCategory =
  | "green_facility"
  | "environmental"
  | "ship_recycling"
  | "ohs"
  | "waste"
  | "national_law"
  | "international_convention"
  | "initiative"
  | "our_compliance";

export type ComplianceStatus = "in_force" | "adopted" | "in_progress" | "achieved" | "planned";

export type LinkCategory =
  | "government"
  | "regulatory"
  | "environmental"
  | "safety"
  | "international"
  | "ship_recycling"
  | "institution"
  | "association";

export type AlbumCategory =
  | "events"
  | "meetings"
  | "seminars"
  | "committee"
  | "yard_visits"
  | "green_yards"
  | "international"
  | "csr"
  | "operations";

export type MeetingType = "board" | "executive_committee" | "general" | "special" | "sub_committee";
export type MemberStatus = "active" | "applicant" | "suspended" | "lapsed";
export type MessageStatus = "new" | "read" | "replied" | "archived";

interface RowMeta {
  id: string;
  created_at: string;
  created_by: string | null;
  updated_at: string;
  updated_by: string | null;
}

export interface Yard extends RowMeta {
  slug: string;
  name_en: string;
  name_bn: string | null;
  status: YardStatus;
  owner_company: string | null;
  address_en: string | null;
  address_bn: string | null;
  latitude: number | null;
  longitude: number | null;
  contact_person: string | null;
  phone: string | null;
  email: string | null;
  website: string | null;
  show_contact: boolean;
  yard_area_sqm: number | null;
  capacity_ldt_per_year: number | null;
  hkc_compliant: boolean;
  certifying_body: string | null;
  certificate_no: string | null;
  certificate_issued_on: string | null;
  certificate_expires_on: string | null;
  description_en: string | null;
  description_bn: string | null;
  facilities_en: string[];
  facilities_bn: string[];
  environmental_en: string[];
  environmental_bn: string[];
  safety_en: string[];
  safety_bn: string[];
  waste_en: string[];
  waste_bn: string[];
  cover_image: string | null;
  gallery: string[];
  sort_order: number;
  is_published: boolean;
}

export interface Member extends RowMeta {
  membership_no: string | null;
  company_name: string;
  company_name_bn: string | null;
  yard_id: string | null;
  representative_name: string | null;
  representative_designation: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  website: string | null;
  status: MemberStatus;
  joined_on: string | null;
  notes: string | null;
}

export interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  organization: string | null;
  designation: string | null;
  phone: string | null;
  avatar_url: string | null;
  role: Role;
  is_active: boolean;
  member_id: string | null;
  last_sign_in_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface SiteSettings {
  id: number;
  org_name_en: string;
  org_name_bn: string;
  tagline_en: string | null;
  tagline_bn: string | null;
  address_en: string | null;
  address_bn: string | null;
  phone: string | null;
  email: string | null;
  office_hours_en: string | null;
  office_hours_bn: string | null;
  map_latitude: number | null;
  map_longitude: number | null;
  media_contact_name: string | null;
  media_contact_email: string | null;
  media_contact_phone: string | null;
  facebook_url: string | null;
  linkedin_url: string | null;
  youtube_url: string | null;
  x_url: string | null;
  bsrb_url: string | null;
  announcement_en: string | null;
  announcement_bn: string | null;
  announcement_url: string | null;
  created_at: string;
  updated_at: string;
  updated_by: string | null;
}

export interface Page extends RowMeta {
  slug: string;
  title_en: string;
  title_bn: string | null;
  summary_en: string | null;
  summary_bn: string | null;
  body_en: string | null;
  body_bn: string | null;
  hero_image: string | null;
  sort_order: number;
  status: PublishStatus;
  access_level: AccessLevel;
  published_at: string | null;
}

export interface Post extends RowMeta {
  slug: string;
  type: PostType;
  title_en: string;
  title_bn: string | null;
  excerpt_en: string | null;
  excerpt_bn: string | null;
  body_en: string | null;
  body_bn: string | null;
  cover_image: string | null;
  gallery: string[];
  source_name: string | null;
  external_url: string | null;
  video_url: string | null;
  event_date: string | null;
  event_location_en: string | null;
  event_location_bn: string | null;
  csr_area: CsrArea | null;
  tags: string[];
  is_featured: boolean;
  status: PublishStatus;
  access_level: AccessLevel;
  published_at: string | null;
}

export interface DocumentRecord extends RowMeta {
  title_en: string;
  title_bn: string | null;
  description_en: string | null;
  description_bn: string | null;
  category: DocumentCategory;
  year: number | null;
  published_on: string | null;
  file_path: string | null;
  file_name: string | null;
  file_size: number | null;
  mime_type: string | null;
  external_url: string | null;
  status: PublishStatus;
  access_level: AccessLevel;
  published_at: string | null;
}

export interface MeetingMinutes extends RowMeta {
  title_en: string;
  title_bn: string | null;
  meeting_type: MeetingType;
  meeting_no: string | null;
  meeting_date: string;
  venue: string | null;
  summary_en: string | null;
  summary_bn: string | null;
  file_path: string | null;
  file_name: string | null;
  file_size: number | null;
  mime_type: string | null;
  status: "draft" | "approved";
  approved_at: string | null;
  access_level: AccessLevel;
}

export interface CommitteeMember extends RowMeta {
  name_en: string;
  name_bn: string | null;
  designation_en: string;
  designation_bn: string | null;
  organization_en: string | null;
  organization_bn: string | null;
  category: "office_bearer" | "member" | "advisor";
  term_label: string;
  is_current: boolean;
  photo: string | null;
  email: string | null;
  phone: string | null;
  show_contact: boolean;
  bio_en: string | null;
  bio_bn: string | null;
  sort_order: number;
  is_published: boolean;
}

export interface PastPresident extends RowMeta {
  name_en: string;
  name_bn: string | null;
  term_start: number | null;
  term_end: number | null;
  organization_en: string | null;
  organization_bn: string | null;
  photo: string | null;
  bio_en: string | null;
  bio_bn: string | null;
  email: string | null;
  show_contact: boolean;
  sort_order: number;
  is_published: boolean;
}

export interface Vessel extends RowMeta {
  yard_id: string | null;
  vessel_name: string;
  former_names: string | null;
  imo_number: string | null;
  flag: string | null;
  vessel_type: VesselType;
  ldt: number | null;
  gross_tonnage: number | null;
  dwt: number | null;
  year_built: number | null;
  arrival_date: string | null;
  beaching_date: string | null;
  cutting_started_on: string | null;
  cutting_completed_on: string | null;
  status: VesselStatus;
  recycling_year: number | null;
  ihm_available: boolean | null;
  noc_number: string | null;
  remarks: string | null;
  is_published: boolean;
}

export interface IndustryStatistic extends RowMeta {
  year: number;
  vessels_recycled: number | null;
  vessels_beached: number | null;
  total_ldt: number | null;
  active_yards: number | null;
  green_yards: number | null;
  steel_output_tonnes: number | null;
  workers_employed: number | null;
  global_share_percent: number | null;
  notes_en: string | null;
  notes_bn: string | null;
  source: string | null;
  is_published: boolean;
}

export interface LabourStatistic extends RowMeta {
  year: number;
  workers_employed: number | null;
  workers_trained: number | null;
  training_sessions: number | null;
  health_checkups: number | null;
  insured_workers: number | null;
  welfare_programmes: number | null;
  notes_en: string | null;
  notes_bn: string | null;
  is_published: boolean;
}

export interface TideEntry extends RowMeta {
  station: string;
  tide_date: string;
  tide_time: string;
  tide_type: "high" | "low";
  height_m: number;
  notes: string | null;
}

export interface ComplianceItem extends RowMeta {
  category: ComplianceCategory;
  title_en: string;
  title_bn: string | null;
  summary_en: string | null;
  summary_bn: string | null;
  body_en: string | null;
  body_bn: string | null;
  authority: string | null;
  reference_no: string | null;
  effective_date: string | null;
  reference_url: string | null;
  status: ComplianceStatus;
  sort_order: number;
  is_published: boolean;
}

export interface LinkItem extends RowMeta {
  title_en: string;
  title_bn: string | null;
  url: string;
  description_en: string | null;
  description_bn: string | null;
  category: LinkCategory;
  logo: string | null;
  is_featured: boolean;
  sort_order: number;
  is_published: boolean;
}

export interface Album extends RowMeta {
  slug: string;
  title_en: string;
  title_bn: string | null;
  description_en: string | null;
  description_bn: string | null;
  category: AlbumCategory;
  event_date: string | null;
  cover_image: string | null;
  sort_order: number;
  is_published: boolean;
}

export interface Photo extends RowMeta {
  album_id: string;
  image_path: string | null;
  video_url: string | null;
  caption_en: string | null;
  caption_bn: string | null;
  credit: string | null;
  width: number | null;
  height: number | null;
  allow_download: boolean;
  sort_order: number;
}

export interface ContactMessage {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  organization: string | null;
  subject: string | null;
  message: string;
  locale: "en" | "bn" | null;
  status: MessageStatus;
  handled_by: string | null;
  handled_at: string | null;
  created_at: string;
}

export interface AuditEntry {
  id: number;
  occurred_at: string;
  actor_id: string | null;
  actor_email: string | null;
  actor_role: Role | null;
  action: string;
  table_name: string;
  record_id: string | null;
  record_label: string | null;
  changed_fields: string[] | null;
  old_data: Record<string, unknown> | null;
  new_data: Record<string, unknown> | null;
}

export interface SearchHit {
  kind: "post" | "page" | "document" | "yard" | "vessel" | "compliance";
  id: string;
  slug: string | null;
  title_en: string;
  title_bn: string | null;
  snippet_en: string | null;
  snippet_bn: string | null;
  meta: string | null;
  rank: number;
}

/** Table name → row type, used by the generic data layer and admin CMS. */
export interface Tables {
  yards: Yard;
  members: Member;
  profiles: Profile;
  site_settings: SiteSettings;
  pages: Page;
  posts: Post;
  documents: DocumentRecord;
  meeting_minutes: MeetingMinutes;
  committee_members: CommitteeMember;
  past_presidents: PastPresident;
  vessels: Vessel;
  industry_statistics: IndustryStatistic;
  labour_statistics: LabourStatistic;
  tide_entries: TideEntry;
  compliance_items: ComplianceItem;
  links: LinkItem;
  albums: Album;
  photos: Photo;
  contact_messages: ContactMessage;
  audit_log: AuditEntry;
}

export type TableName = keyof Tables;
