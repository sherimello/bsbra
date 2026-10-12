import type { PermissionGroup } from "@/lib/auth/permissions";
import type { TableName } from "@/lib/types";

/**
 * Declarative description of every table managed in the admin panel. The
 * list pages, edit forms, validation and server actions are all generated
 * from this file, so adding a field is a one-line change here (plus the
 * column in a migration).
 */

export type FieldType =
  | "text"
  | "textarea"
  | "markdown"
  | "slug"
  | "url"
  | "email"
  | "select"
  | "relation"
  | "number"
  | "decimal"
  | "date"
  | "datetime"
  | "time"
  | "boolean"
  | "list"
  | "image"
  | "images"
  | "file"
  | "imo";

export interface Option {
  value: string;
  label: string;
}

export interface FieldConfig {
  name: string;
  label: string;
  type: FieldType;
  /** Expands to name_en / name_bn with side-by-side inputs. */
  bilingual?: boolean;
  required?: boolean;
  help?: string;
  placeholder?: string;
  options?: Option[];
  /** For relation fields: which resource provides the options. */
  relation?: { table: TableName; label: string; order?: string };
  /** For slug fields: the field it is generated from. */
  from?: string;
  /** Storage bucket for image/file fields. */
  bucket?: "media" | "documents" | "minutes";
  /** For file fields, also store name/size/mime in these columns. */
  fileColumns?: { name: string; size: string; mime: string };
  min?: number;
  max?: number;
  /** Section heading the field is grouped under in the form. */
  section?: string;
  /** Takes the full form width. */
  wide?: boolean;
  /** Shown but not editable. */
  readOnly?: boolean;
  defaultValue?: string | number | boolean | string[];
}

export type ColumnKind = "text" | "title" | "badge" | "date" | "datetime" | "number" | "boolean" | "image" | "relation" | "access" | "status";

export interface ColumnConfig {
  name: string;
  label: string;
  kind?: ColumnKind;
  /** For badge columns: option labels. */
  options?: Option[];
  numeric?: boolean;
}

export interface ResourceConfig {
  key: string;
  table: TableName;
  label: string;
  singular: string;
  description: string;
  group: "Content" | "Industry data" | "Governance";
  permission: PermissionGroup;
  /** Column used as the record's display name. */
  titleField: string;
  fields: FieldConfig[];
  columns: ColumnConfig[];
  search: string[];
  filters?: { name: string; label: string; options: Option[] }[];
  defaultSort: { col: string; ascending?: boolean };
  /** Public URL of a record, for the "View on site" link. */
  publicPath?: (row: Record<string, unknown>) => string | null;
  canCreate?: boolean;
  /** Has an editorial status column (draft/review/published/archived). */
  editorial?: boolean;
}

const o = (values: Record<string, string>): Option[] => Object.entries(values).map(([value, label]) => ({ value, label }));

export const OPTIONS = {
  status: o({ draft: "Draft", review: "In review", published: "Published", archived: "Archived" }),
  access: o({ public: "Public", corporate: "Corporate", members: "Members", internal: "Internal" }),
  postType: o({
    news: "News", industry_update: "Industry update", activity: "BSBRA activity", event: "Event", meeting: "Meeting",
    seminar: "Seminar", workshop: "Workshop", announcement: "Announcement", press_release: "Press release",
    media_coverage: "Media coverage", tv_report: "TV report", statement: "Statement", interview: "Interview",
    international: "International", csr: "CSR",
  }),
  csrArea: o({
    community: "Community development", education: "Education", health: "Health", worker_welfare: "Worker welfare",
    local_support: "Local community support", environment: "Environment", social: "Social development",
  }),
  documentCategory: o({
    publication: "Publication", annual_report: "Annual report", industry_report: "Industry report", guideline: "Guideline",
    policy: "Policy", circular: "Circular", notice: "Notice", form: "Form", research_paper: "Research paper",
    law_regulation: "Law & regulation", other: "Other",
  }),
  meetingType: o({
    board: "Board meeting", executive_committee: "Executive Committee", general: "General meeting", special: "Special meeting",
    sub_committee: "Sub-committee",
  }),
  minutesStatus: o({ draft: "Draft", approved: "Approved" }),
  committeeCategory: o({ office_bearer: "Office bearer", member: "Committee member", advisor: "Advisor" }),
  yardStatus: o({ green: "Green yard", progressive: "Progressive", conventional: "Conventional", inactive: "Inactive" }),
  vesselType: o({
    bulk_carrier: "Bulk carrier", oil_tanker: "Oil tanker", chemical_tanker: "Chemical tanker", gas_carrier: "Gas carrier",
    container: "Container ship", general_cargo: "General cargo", ro_ro: "Ro-Ro", passenger: "Passenger", reefer: "Reefer",
    offshore: "Offshore", tug: "Tug", other: "Other",
  }),
  vesselStatus: o({ anchored: "At anchorage", beached: "Beached", cutting: "Cutting", completed: "Completed" }),
  tideType: o({ high: "High", low: "Low" }),
  complianceCategory: o({
    green_facility: "Green facilities", environmental: "Environmental", ship_recycling: "Ship recycling", ohs: "OHS",
    waste: "Waste management", national_law: "National law", international_convention: "International convention",
    initiative: "Initiative", our_compliance: "Our compliance",
  }),
  complianceStatus: o({ in_force: "In force", adopted: "Adopted", in_progress: "In progress", achieved: "Achieved", planned: "Planned" }),
  linkCategory: o({
    government: "Government", regulatory: "Regulatory", environmental: "Environment", safety: "Safety",
    international: "International", ship_recycling: "Ship recycling", institution: "Institution", association: "Association",
  }),
  albumCategory: o({
    events: "BSBRA events", meetings: "Meetings", seminars: "Seminars & workshops", committee: "Executive Committee",
    yard_visits: "Yard visits", green_yards: "Green yards", international: "International", csr: "CSR", operations: "Ship recycling",
  }),
  memberStatus: o({ active: "Active", applicant: "Applicant", suspended: "Suspended", lapsed: "Lapsed" }),
  messageStatus: o({ new: "New", read: "Read", replied: "Replied", archived: "Archived" }),
};

const publishing: FieldConfig[] = [
  { name: "status", label: "Status", type: "select", options: OPTIONS.status, required: true, defaultValue: "draft", section: "Publishing" },
  { name: "access_level", label: "Who can see this", type: "select", options: OPTIONS.access, required: true, defaultValue: "public", section: "Publishing", help: "Corporate, Members and Internal items appear only in the portal for signed-in users with that access." },
];

export const resources: ResourceConfig[] = [
  // ------------------------------------------------------------------ Content
  {
    key: "posts",
    table: "posts",
    label: "News & posts",
    singular: "Post",
    description: "News, announcements, events, press, international and CSR items.",
    group: "Content",
    permission: "content",
    titleField: "title_en",
    editorial: true,
    fields: [
      { name: "title", label: "Title", type: "text", bilingual: true, required: true, wide: true },
      { name: "slug", label: "URL slug", type: "slug", from: "title_en", required: true, help: "Lowercase words separated by hyphens. Appears in the address: /news/your-slug" },
      { name: "type", label: "Type", type: "select", options: OPTIONS.postType, required: true, defaultValue: "news" },
      { name: "excerpt", label: "Summary", type: "textarea", bilingual: true, wide: true, help: "One or two sentences shown on cards and in search results." },
      { name: "body", label: "Article", type: "markdown", bilingual: true, wide: true },
      { name: "cover_image", label: "Cover image", type: "image", bucket: "media", section: "Media" },
      { name: "video_url", label: "Video link (YouTube/Vimeo)", type: "url", section: "Media" },
      { name: "source_name", label: "Source (newspaper / channel)", type: "text", section: "Press & media" },
      { name: "external_url", label: "Original article link", type: "url", section: "Press & media" },
      { name: "event_date", label: "Event date & time", type: "datetime", section: "Event" },
      { name: "event_location", label: "Event location", type: "text", bilingual: true, section: "Event" },
      { name: "csr_area", label: "CSR area", type: "select", options: OPTIONS.csrArea, section: "CSR" },
      { name: "tags", label: "Tags", type: "list", section: "Publishing", help: "One per line." },
      { name: "is_featured", label: "Feature on the homepage", type: "boolean", section: "Publishing" },
      ...publishing,
      { name: "published_at", label: "Publish date", type: "datetime", section: "Publishing", help: "Set automatically when first published." },
    ],
    columns: [
      { name: "title_en", label: "Title", kind: "title" },
      { name: "type", label: "Type", kind: "badge", options: OPTIONS.postType },
      { name: "status", label: "Status", kind: "status" },
      { name: "access_level", label: "Access", kind: "access" },
      { name: "published_at", label: "Published", kind: "date" },
    ],
    search: ["title_en", "title_bn", "slug"],
    filters: [
      { name: "type", label: "Type", options: OPTIONS.postType },
      { name: "status", label: "Status", options: OPTIONS.status },
    ],
    defaultSort: { col: "published_at", ascending: false },
    publicPath: (r) => (r.status === "published" ? `/en/news/${r.slug}` : null),
  },
  {
    key: "pages",
    table: "pages",
    label: "Pages",
    singular: "Page",
    description: "About, compliance, waste, safety, labour and other long-form pages.",
    group: "Content",
    permission: "content",
    titleField: "title_en",
    editorial: true,
    fields: [
      { name: "title", label: "Title", type: "text", bilingual: true, required: true, wide: true },
      { name: "slug", label: "Slug", type: "slug", from: "title_en", required: true, help: "Used by the site to place the page — change only if you know where it is used." },
      { name: "sort_order", label: "Order", type: "number", defaultValue: 0 },
      { name: "summary", label: "Summary", type: "textarea", bilingual: true, wide: true },
      { name: "body", label: "Body", type: "markdown", bilingual: true, wide: true, help: "Start a new section with “## Heading”. Each section animates in on the site." },
      { name: "hero_image", label: "Hero image", type: "image", bucket: "media", section: "Media" },
      ...publishing,
    ],
    columns: [
      { name: "title_en", label: "Title", kind: "title" },
      { name: "slug", label: "Slug" },
      { name: "status", label: "Status", kind: "status" },
      { name: "updated_at", label: "Updated", kind: "datetime" },
    ],
    search: ["title_en", "title_bn", "slug"],
    defaultSort: { col: "slug" },
  },
  {
    key: "documents",
    table: "documents",
    label: "Documents",
    singular: "Document",
    description: "Publications, reports, circulars, notices, forms and laws.",
    group: "Content",
    permission: "content",
    titleField: "title_en",
    editorial: true,
    fields: [
      { name: "title", label: "Title", type: "text", bilingual: true, required: true, wide: true },
      { name: "category", label: "Category", type: "select", options: OPTIONS.documentCategory, required: true, defaultValue: "publication" },
      { name: "year", label: "Year", type: "number", min: 1960, max: 2100 },
      { name: "published_on", label: "Date of issue", type: "date" },
      { name: "description", label: "Description", type: "textarea", bilingual: true, wide: true },
      { name: "file_path", label: "File", type: "file", bucket: "documents", section: "File", fileColumns: { name: "file_name", size: "file_size", mime: "mime_type" }, help: "PDF, Word, Excel, PowerPoint, CSV or ZIP — up to 50 MB." },
      { name: "external_url", label: "…or link to an external file", type: "url", section: "File" },
      ...publishing,
    ],
    columns: [
      { name: "title_en", label: "Title", kind: "title" },
      { name: "category", label: "Category", kind: "badge", options: OPTIONS.documentCategory },
      { name: "year", label: "Year", numeric: true },
      { name: "status", label: "Status", kind: "status" },
      { name: "access_level", label: "Access", kind: "access" },
    ],
    search: ["title_en", "title_bn"],
    filters: [
      { name: "category", label: "Category", options: OPTIONS.documentCategory },
      { name: "access_level", label: "Access", options: OPTIONS.access },
    ],
    defaultSort: { col: "published_on", ascending: false },
  },
  {
    key: "committee",
    table: "committee_members",
    label: "Executive Committee",
    singular: "Committee member",
    description: "Current office bearers, members and advisors.",
    group: "Content",
    permission: "content",
    titleField: "name_en",
    fields: [
      { name: "name", label: "Name", type: "text", bilingual: true, required: true, wide: true },
      { name: "designation", label: "Designation", type: "text", bilingual: true, required: true },
      { name: "organization", label: "Organisation", type: "text", bilingual: true },
      { name: "category", label: "Group", type: "select", options: OPTIONS.committeeCategory, required: true, defaultValue: "office_bearer" },
      { name: "term_label", label: "Term", type: "text", required: true, placeholder: "2026–2028" },
      { name: "is_current", label: "Current committee", type: "boolean", defaultValue: true },
      { name: "sort_order", label: "Order", type: "number", defaultValue: 0 },
      { name: "photo", label: "Photograph", type: "image", bucket: "media", section: "Profile" },
      { name: "bio", label: "Profile", type: "textarea", bilingual: true, wide: true, section: "Profile" },
      { name: "email", label: "Email", type: "email", section: "Contact" },
      { name: "phone", label: "Phone", type: "text", section: "Contact" },
      { name: "show_contact", label: "Show contact details publicly", type: "boolean", section: "Contact" },
      { name: "is_published", label: "Published", type: "boolean", defaultValue: true, section: "Publishing" },
    ],
    columns: [
      { name: "photo", label: "", kind: "image" },
      { name: "name_en", label: "Name", kind: "title" },
      { name: "designation_en", label: "Designation" },
      { name: "term_label", label: "Term" },
      { name: "is_current", label: "Current", kind: "boolean" },
    ],
    search: ["name_en", "name_bn", "designation_en"],
    defaultSort: { col: "sort_order" },
    publicPath: () => "/en/leadership",
  },
  {
    key: "past-presidents",
    table: "past_presidents",
    label: "Past presidents",
    singular: "Past president",
    description: "Historical leadership of BSBRA.",
    group: "Content",
    permission: "content",
    titleField: "name_en",
    fields: [
      { name: "name", label: "Name", type: "text", bilingual: true, required: true, wide: true },
      { name: "term_start", label: "Term from (year)", type: "number", min: 1960, max: 2100 },
      { name: "term_end", label: "Term to (year)", type: "number", min: 1960, max: 2100 },
      { name: "organization", label: "Organisation", type: "text", bilingual: true },
      { name: "photo", label: "Photograph", type: "image", bucket: "media" },
      { name: "bio", label: "Profile", type: "textarea", bilingual: true, wide: true },
      { name: "email", label: "Email", type: "email" },
      { name: "show_contact", label: "Show contact publicly", type: "boolean" },
      { name: "sort_order", label: "Order", type: "number", defaultValue: 0 },
      { name: "is_published", label: "Published", type: "boolean", defaultValue: true },
    ],
    columns: [
      { name: "photo", label: "", kind: "image" },
      { name: "name_en", label: "Name", kind: "title" },
      { name: "term_start", label: "From", numeric: true },
      { name: "term_end", label: "To", numeric: true },
    ],
    search: ["name_en", "name_bn"],
    defaultSort: { col: "term_start", ascending: false },
  },
  {
    key: "compliance",
    table: "compliance_items",
    label: "Compliance",
    singular: "Compliance item",
    description: "Laws, conventions, facilities, initiatives and BSBRA's own compliances.",
    group: "Content",
    permission: "content",
    titleField: "title_en",
    fields: [
      { name: "title", label: "Title", type: "text", bilingual: true, required: true, wide: true },
      { name: "category", label: "Category", type: "select", options: OPTIONS.complianceCategory, required: true },
      { name: "status", label: "Status", type: "select", options: OPTIONS.complianceStatus, required: true, defaultValue: "in_force" },
      { name: "summary", label: "Summary", type: "textarea", bilingual: true, wide: true },
      { name: "body", label: "Details", type: "markdown", bilingual: true, wide: true },
      { name: "authority", label: "Issuing authority", type: "text" },
      { name: "reference_no", label: "Reference number", type: "text" },
      { name: "effective_date", label: "Effective date", type: "date" },
      { name: "reference_url", label: "Reference link", type: "url" },
      { name: "sort_order", label: "Order", type: "number", defaultValue: 0 },
      { name: "is_published", label: "Published", type: "boolean", defaultValue: true },
    ],
    columns: [
      { name: "title_en", label: "Title", kind: "title" },
      { name: "category", label: "Category", kind: "badge", options: OPTIONS.complianceCategory },
      { name: "status", label: "Status", kind: "badge", options: OPTIONS.complianceStatus },
      { name: "is_published", label: "Published", kind: "boolean" },
    ],
    search: ["title_en", "title_bn", "authority"],
    filters: [{ name: "category", label: "Category", options: OPTIONS.complianceCategory }],
    defaultSort: { col: "category" },
    publicPath: (r) => (r.category === "our_compliance" ? "/en/compliance/our-compliances" : "/en/compliance"),
  },
  {
    key: "links",
    table: "links",
    label: "Links",
    singular: "Link",
    description: "Regulatory, government and international links.",
    group: "Content",
    permission: "content",
    titleField: "title_en",
    fields: [
      { name: "title", label: "Title", type: "text", bilingual: true, required: true, wide: true },
      { name: "url", label: "Website address", type: "url", required: true },
      { name: "category", label: "Category", type: "select", options: OPTIONS.linkCategory, required: true, defaultValue: "institution" },
      { name: "description", label: "Description", type: "textarea", bilingual: true, wide: true },
      { name: "logo", label: "Logo", type: "image", bucket: "media" },
      { name: "is_featured", label: "Featured (shown prominently)", type: "boolean" },
      { name: "sort_order", label: "Order", type: "number", defaultValue: 0 },
      { name: "is_published", label: "Published", type: "boolean", defaultValue: true },
    ],
    columns: [
      { name: "title_en", label: "Title", kind: "title" },
      { name: "category", label: "Category", kind: "badge", options: OPTIONS.linkCategory },
      { name: "url", label: "URL" },
      { name: "is_featured", label: "Featured", kind: "boolean" },
    ],
    search: ["title_en", "title_bn", "url"],
    defaultSort: { col: "sort_order" },
    publicPath: () => "/en/links",
  },
  {
    key: "albums",
    table: "albums",
    label: "Gallery albums",
    singular: "Album",
    description: "Photo albums. Open an album to add photographs.",
    group: "Content",
    permission: "content",
    titleField: "title_en",
    fields: [
      { name: "title", label: "Title", type: "text", bilingual: true, required: true, wide: true },
      { name: "slug", label: "URL slug", type: "slug", from: "title_en", required: true },
      { name: "category", label: "Category", type: "select", options: OPTIONS.albumCategory, required: true, defaultValue: "events" },
      { name: "event_date", label: "Date", type: "date" },
      { name: "description", label: "Description", type: "textarea", bilingual: true, wide: true },
      { name: "cover_image", label: "Cover image", type: "image", bucket: "media" },
      { name: "sort_order", label: "Order", type: "number", defaultValue: 0 },
      { name: "is_published", label: "Published", type: "boolean", defaultValue: true },
    ],
    columns: [
      { name: "cover_image", label: "", kind: "image" },
      { name: "title_en", label: "Title", kind: "title" },
      { name: "category", label: "Category", kind: "badge", options: OPTIONS.albumCategory },
      { name: "event_date", label: "Date", kind: "date" },
      { name: "is_published", label: "Published", kind: "boolean" },
    ],
    search: ["title_en", "title_bn", "slug"],
    defaultSort: { col: "event_date", ascending: false },
    publicPath: (r) => `/en/gallery/${r.slug}`,
  },
  {
    key: "photos",
    table: "photos",
    label: "Photos",
    singular: "Photo",
    description: "Individual photographs and videos within albums.",
    group: "Content",
    permission: "content",
    titleField: "caption_en",
    fields: [
      { name: "album_id", label: "Album", type: "relation", relation: { table: "albums", label: "title_en", order: "title_en" }, required: true },
      { name: "image_path", label: "Photograph", type: "image", bucket: "media" },
      { name: "video_url", label: "…or video link", type: "url" },
      { name: "caption", label: "Caption", type: "text", bilingual: true, wide: true },
      { name: "credit", label: "Credit", type: "text" },
      { name: "allow_download", label: "Allow visitors to download", type: "boolean", defaultValue: true },
      { name: "sort_order", label: "Order", type: "number", defaultValue: 0 },
    ],
    columns: [
      { name: "image_path", label: "", kind: "image" },
      { name: "caption_en", label: "Caption", kind: "title" },
      { name: "album_id", label: "Album", kind: "relation" },
      { name: "sort_order", label: "Order", numeric: true },
    ],
    search: ["caption_en", "caption_bn", "credit"],
    defaultSort: { col: "sort_order" },
  },

  // ------------------------------------------------------------ Industry data
  {
    key: "yards",
    table: "yards",
    label: "Yards",
    singular: "Yard",
    description: "Green, progressive and conventional ship recycling yards.",
    group: "Industry data",
    permission: "data",
    titleField: "name_en",
    fields: [
      { name: "name", label: "Yard name", type: "text", bilingual: true, required: true, wide: true },
      { name: "slug", label: "URL slug", type: "slug", from: "name_en", required: true },
      { name: "status", label: "Status", type: "select", options: OPTIONS.yardStatus, required: true, defaultValue: "conventional" },
      { name: "owner_company", label: "Owner company", type: "text" },
      { name: "address", label: "Address", type: "text", bilingual: true, wide: true },
      { name: "latitude", label: "Latitude", type: "decimal", min: -90, max: 90, section: "Location" },
      { name: "longitude", label: "Longitude", type: "decimal", min: -180, max: 180, section: "Location" },
      { name: "description", label: "Overview", type: "textarea", bilingual: true, wide: true },
      { name: "hkc_compliant", label: "Hong Kong Convention compliant", type: "boolean", section: "Certification" },
      { name: "certifying_body", label: "Certifying body", type: "text", section: "Certification" },
      { name: "certificate_no", label: "Certificate number", type: "text", section: "Certification" },
      { name: "certificate_issued_on", label: "Issued on", type: "date", section: "Certification" },
      { name: "certificate_expires_on", label: "Valid until", type: "date", section: "Certification" },
      { name: "yard_area_sqm", label: "Yard area (m²)", type: "decimal", min: 0, section: "Capacity" },
      { name: "capacity_ldt_per_year", label: "Capacity (LDT / year)", type: "decimal", min: 0, section: "Capacity" },
      { name: "facilities", label: "Yard facilities", type: "list", bilingual: true, section: "Facilities", help: "One per line." },
      { name: "environmental", label: "Environmental facilities", type: "list", bilingual: true, section: "Facilities" },
      { name: "safety", label: "Safety facilities", type: "list", bilingual: true, section: "Facilities" },
      { name: "waste", label: "Waste management facilities", type: "list", bilingual: true, section: "Facilities" },
      { name: "cover_image", label: "Cover image", type: "image", bucket: "media", section: "Photographs" },
      { name: "gallery", label: "Photographs", type: "images", bucket: "media", section: "Photographs" },
      { name: "contact_person", label: "Contact person", type: "text", section: "Contact" },
      { name: "phone", label: "Phone", type: "text", section: "Contact" },
      { name: "email", label: "Email", type: "email", section: "Contact" },
      { name: "website", label: "Website", type: "url", section: "Contact" },
      { name: "show_contact", label: "Show contact details publicly", type: "boolean", defaultValue: true, section: "Contact" },
      { name: "sort_order", label: "Order", type: "number", defaultValue: 0, section: "Publishing" },
      { name: "is_published", label: "Published", type: "boolean", defaultValue: true, section: "Publishing" },
    ],
    columns: [
      { name: "cover_image", label: "", kind: "image" },
      { name: "name_en", label: "Yard", kind: "title" },
      { name: "status", label: "Status", kind: "badge", options: OPTIONS.yardStatus },
      { name: "certifying_body", label: "Certified by" },
      { name: "hkc_compliant", label: "HKC", kind: "boolean" },
      { name: "is_published", label: "Published", kind: "boolean" },
    ],
    search: ["name_en", "name_bn", "owner_company", "slug"],
    filters: [{ name: "status", label: "Status", options: OPTIONS.yardStatus }],
    defaultSort: { col: "sort_order" },
    publicPath: (r) => `/en/yards/${r.slug}`,
  },
  {
    key: "vessels",
    table: "vessels",
    label: "Vessels",
    singular: "Vessel",
    description: "Yard-wise vessel and scrap vessel database.",
    group: "Industry data",
    permission: "data",
    titleField: "vessel_name",
    fields: [
      { name: "vessel_name", label: "Vessel name", type: "text", required: true },
      { name: "imo_number", label: "IMO number", type: "imo", help: "Seven digits; the last is a check digit and is validated automatically." },
      { name: "former_names", label: "Former names", type: "text" },
      { name: "flag", label: "Flag", type: "text" },
      { name: "vessel_type", label: "Vessel type", type: "select", options: OPTIONS.vesselType, required: true, defaultValue: "bulk_carrier" },
      { name: "yard_id", label: "Yard", type: "relation", relation: { table: "yards", label: "name_en", order: "name_en" } },
      { name: "ldt", label: "LDT", type: "decimal", min: 0, section: "Particulars" },
      { name: "gross_tonnage", label: "Gross tonnage", type: "decimal", min: 0, section: "Particulars" },
      { name: "dwt", label: "Deadweight", type: "decimal", min: 0, section: "Particulars" },
      { name: "year_built", label: "Year built", type: "number", min: 1900, max: 2100, section: "Particulars" },
      { name: "ihm_available", label: "Inventory of Hazardous Materials available", type: "boolean", section: "Particulars" },
      { name: "noc_number", label: "NOC number", type: "text", section: "Particulars" },
      { name: "arrival_date", label: "Arrival date", type: "date", section: "Recycling" },
      { name: "beaching_date", label: "Beaching date", type: "date", section: "Recycling" },
      { name: "cutting_started_on", label: "Cutting started", type: "date", section: "Recycling" },
      { name: "cutting_completed_on", label: "Cutting completed", type: "date", section: "Recycling" },
      { name: "status", label: "Status", type: "select", options: OPTIONS.vesselStatus, required: true, defaultValue: "anchored", section: "Recycling" },
      { name: "remarks", label: "Remarks", type: "textarea", wide: true, section: "Recycling" },
      { name: "is_published", label: "Published", type: "boolean", defaultValue: true, section: "Publishing" },
    ],
    columns: [
      { name: "vessel_name", label: "Vessel", kind: "title" },
      { name: "imo_number", label: "IMO" },
      { name: "vessel_type", label: "Type", kind: "badge", options: OPTIONS.vesselType },
      { name: "ldt", label: "LDT", kind: "number", numeric: true },
      { name: "yard_id", label: "Yard", kind: "relation" },
      { name: "beaching_date", label: "Beached", kind: "date" },
      { name: "status", label: "Status", kind: "badge", options: OPTIONS.vesselStatus },
    ],
    search: ["vessel_name", "imo_number", "flag", "former_names"],
    filters: [
      { name: "vessel_type", label: "Type", options: OPTIONS.vesselType },
      { name: "status", label: "Status", options: OPTIONS.vesselStatus },
    ],
    defaultSort: { col: "beaching_date", ascending: false },
    publicPath: (r) => `/en/vessels/${r.id}`,
  },
  {
    key: "statistics",
    table: "industry_statistics",
    label: "Industry statistics",
    singular: "Year",
    description: "Official year-wise figures shown on the statistics page.",
    group: "Industry data",
    permission: "data",
    titleField: "year",
    fields: [
      { name: "year", label: "Year", type: "number", required: true, min: 1960, max: 2100 },
      { name: "vessels_recycled", label: "Vessels recycled", type: "number", min: 0 },
      { name: "vessels_beached", label: "Vessels beached", type: "number", min: 0 },
      { name: "total_ldt", label: "Total LDT", type: "decimal", min: 0 },
      { name: "active_yards", label: "Active yards", type: "number", min: 0 },
      { name: "green_yards", label: "Green yards", type: "number", min: 0 },
      { name: "steel_output_tonnes", label: "Steel output (tonnes)", type: "decimal", min: 0 },
      { name: "workers_employed", label: "Workers employed", type: "number", min: 0 },
      { name: "global_share_percent", label: "Global share (%)", type: "decimal", min: 0, max: 100 },
      { name: "source", label: "Source", type: "text", wide: true },
      { name: "notes", label: "Notes", type: "textarea", bilingual: true, wide: true },
      { name: "is_published", label: "Published", type: "boolean", defaultValue: true },
    ],
    columns: [
      { name: "year", label: "Year", kind: "title" },
      { name: "vessels_recycled", label: "Recycled", kind: "number", numeric: true },
      { name: "total_ldt", label: "LDT", kind: "number", numeric: true },
      { name: "active_yards", label: "Active yards", kind: "number", numeric: true },
      { name: "green_yards", label: "Green yards", kind: "number", numeric: true },
      { name: "is_published", label: "Published", kind: "boolean" },
    ],
    search: ["source"],
    defaultSort: { col: "year", ascending: false },
    publicPath: () => "/en/industry",
  },
  {
    key: "labour",
    table: "labour_statistics",
    label: "Labour statistics",
    singular: "Year",
    description: "Workforce, training, health and welfare figures.",
    group: "Industry data",
    permission: "data",
    titleField: "year",
    fields: [
      { name: "year", label: "Year", type: "number", required: true, min: 1960, max: 2100 },
      { name: "workers_employed", label: "Workers employed", type: "number", min: 0 },
      { name: "workers_trained", label: "Workers trained", type: "number", min: 0 },
      { name: "training_sessions", label: "Training sessions", type: "number", min: 0 },
      { name: "health_checkups", label: "Health check-ups", type: "number", min: 0 },
      { name: "insured_workers", label: "Insured workers", type: "number", min: 0 },
      { name: "welfare_programmes", label: "Welfare programmes", type: "number", min: 0 },
      { name: "notes", label: "Notes", type: "textarea", bilingual: true, wide: true },
      { name: "is_published", label: "Published", type: "boolean", defaultValue: true },
    ],
    columns: [
      { name: "year", label: "Year", kind: "title" },
      { name: "workers_employed", label: "Workers", kind: "number", numeric: true },
      { name: "workers_trained", label: "Trained", kind: "number", numeric: true },
      { name: "insured_workers", label: "Insured", kind: "number", numeric: true },
      { name: "is_published", label: "Published", kind: "boolean" },
    ],
    search: [],
    defaultSort: { col: "year", ascending: false },
    publicPath: () => "/en/labour",
  },
  {
    key: "tides",
    table: "tide_entries",
    label: "Tide entries",
    singular: "Tide entry",
    description: "High and low tides. Use Import to load a full year from CSV.",
    group: "Industry data",
    permission: "data",
    titleField: "tide_date",
    fields: [
      { name: "station", label: "Station", type: "text", required: true, defaultValue: "Sitakunda Coast" },
      { name: "tide_date", label: "Date", type: "date", required: true },
      { name: "tide_time", label: "Time (BST)", type: "time", required: true },
      { name: "tide_type", label: "Type", type: "select", options: OPTIONS.tideType, required: true, defaultValue: "high" },
      { name: "height_m", label: "Height (m)", type: "decimal", required: true, min: -5, max: 15 },
      { name: "notes", label: "Notes", type: "text", wide: true },
    ],
    columns: [
      { name: "tide_date", label: "Date", kind: "date" },
      { name: "tide_time", label: "Time" },
      { name: "tide_type", label: "Type", kind: "badge", options: OPTIONS.tideType },
      { name: "height_m", label: "Height (m)", kind: "number", numeric: true },
      { name: "station", label: "Station" },
    ],
    search: ["station"],
    filters: [{ name: "tide_type", label: "Type", options: OPTIONS.tideType }],
    defaultSort: { col: "tide_date", ascending: false },
    publicPath: () => "/en/tides",
  },
  {
    key: "members",
    table: "members",
    label: "Members",
    singular: "Member",
    description: "The association's member organisations.",
    group: "Industry data",
    permission: "members",
    titleField: "company_name",
    fields: [
      { name: "company_name", label: "Company name", type: "text", required: true, wide: true },
      { name: "company_name_bn", label: "Company name (বাংলা)", type: "text", wide: true },
      { name: "membership_no", label: "Membership number", type: "text" },
      { name: "status", label: "Status", type: "select", options: OPTIONS.memberStatus, required: true, defaultValue: "active" },
      { name: "joined_on", label: "Joined on", type: "date" },
      { name: "yard_id", label: "Yard", type: "relation", relation: { table: "yards", label: "name_en", order: "name_en" } },
      { name: "representative_name", label: "Representative", type: "text", section: "Contact" },
      { name: "representative_designation", label: "Designation", type: "text", section: "Contact" },
      { name: "phone", label: "Phone", type: "text", section: "Contact" },
      { name: "email", label: "Email", type: "email", section: "Contact" },
      { name: "website", label: "Website", type: "url", section: "Contact" },
      { name: "address", label: "Address", type: "textarea", wide: true, section: "Contact" },
      { name: "notes", label: "Internal notes", type: "textarea", wide: true, section: "Notes" },
    ],
    columns: [
      { name: "membership_no", label: "No." },
      { name: "company_name", label: "Company", kind: "title" },
      { name: "yard_id", label: "Yard", kind: "relation" },
      { name: "status", label: "Status", kind: "badge", options: OPTIONS.memberStatus },
      { name: "joined_on", label: "Joined", kind: "date" },
    ],
    search: ["company_name", "company_name_bn", "membership_no", "representative_name"],
    filters: [{ name: "status", label: "Status", options: OPTIONS.memberStatus }],
    defaultSort: { col: "company_name" },
  },

  // --------------------------------------------------------------- Governance
  {
    key: "minutes",
    table: "meeting_minutes",
    label: "Minutes",
    singular: "Minutes",
    description: "Board and Executive Committee minutes. Only approved minutes reach the portal.",
    group: "Governance",
    permission: "minutes",
    titleField: "title_en",
    fields: [
      { name: "title", label: "Title", type: "text", bilingual: true, required: true, wide: true },
      { name: "meeting_type", label: "Meeting", type: "select", options: OPTIONS.meetingType, required: true, defaultValue: "executive_committee" },
      { name: "meeting_no", label: "Meeting number", type: "text" },
      { name: "meeting_date", label: "Meeting date", type: "date", required: true },
      { name: "venue", label: "Venue", type: "text" },
      { name: "summary", label: "Summary", type: "textarea", bilingual: true, wide: true },
      { name: "file_path", label: "Minutes file", type: "file", bucket: "minutes", fileColumns: { name: "file_name", size: "file_size", mime: "mime_type" }, help: "PDF or Word, up to 50 MB.", section: "File" },
      { name: "status", label: "Status", type: "select", options: OPTIONS.minutesStatus, required: true, defaultValue: "draft", section: "Access" },
      { name: "access_level", label: "Who can see approved minutes", type: "select", options: OPTIONS.access, required: true, defaultValue: "internal", section: "Access", help: "Internal = Executive Committee and staff. Members = all members." },
    ],
    columns: [
      { name: "title_en", label: "Title", kind: "title" },
      { name: "meeting_type", label: "Meeting", kind: "badge", options: OPTIONS.meetingType },
      { name: "meeting_date", label: "Date", kind: "date" },
      { name: "status", label: "Status", kind: "badge", options: OPTIONS.minutesStatus },
      { name: "access_level", label: "Access", kind: "access" },
    ],
    search: ["title_en", "title_bn", "meeting_no"],
    filters: [
      { name: "meeting_type", label: "Meeting", options: OPTIONS.meetingType },
      { name: "status", label: "Status", options: OPTIONS.minutesStatus },
    ],
    defaultSort: { col: "meeting_date", ascending: false },
  },
  {
    key: "messages",
    table: "contact_messages",
    label: "Messages",
    singular: "Message",
    description: "Enquiries sent through the contact form.",
    group: "Governance",
    permission: "messages",
    titleField: "subject",
    canCreate: false,
    fields: [
      { name: "name", label: "Name", type: "text", readOnly: true },
      { name: "email", label: "Email", type: "email", readOnly: true },
      { name: "phone", label: "Phone", type: "text", readOnly: true },
      { name: "organization", label: "Organisation", type: "text", readOnly: true },
      { name: "subject", label: "Subject", type: "text", readOnly: true, wide: true },
      { name: "message", label: "Message", type: "textarea", readOnly: true, wide: true },
      { name: "status", label: "Status", type: "select", options: OPTIONS.messageStatus, required: true },
    ],
    columns: [
      { name: "subject", label: "Subject", kind: "title" },
      { name: "name", label: "From" },
      { name: "email", label: "Email" },
      { name: "status", label: "Status", kind: "badge", options: OPTIONS.messageStatus },
      { name: "created_at", label: "Received", kind: "datetime" },
    ],
    search: ["name", "email", "subject", "message"],
    filters: [{ name: "status", label: "Status", options: OPTIONS.messageStatus }],
    defaultSort: { col: "created_at", ascending: false },
  },
];

export function getResource(key: string): ResourceConfig | undefined {
  return resources.find((r) => r.key === key);
}

/** Expands bilingual fields into their stored column names. */
export function columnsOf(field: FieldConfig): string[] {
  if (field.type === "file" && field.fileColumns) {
    return [field.name, field.fileColumns.name, field.fileColumns.size, field.fileColumns.mime];
  }
  return field.bilingual ? [`${field.name}_en`, `${field.name}_bn`] : [field.name];
}

export const SETTINGS_FIELDS: FieldConfig[] = [
  { name: "org_name", label: "Organisation name", type: "text", bilingual: true, required: true, wide: true },
  { name: "tagline", label: "Tagline", type: "text", bilingual: true, wide: true },
  { name: "address", label: "Address", type: "text", bilingual: true, wide: true, section: "Contact" },
  { name: "phone", label: "Phone", type: "text", section: "Contact" },
  { name: "email", label: "Email", type: "email", section: "Contact" },
  { name: "office_hours", label: "Office hours", type: "text", bilingual: true, section: "Contact" },
  { name: "map_latitude", label: "Map latitude", type: "decimal", min: -90, max: 90, section: "Contact" },
  { name: "map_longitude", label: "Map longitude", type: "decimal", min: -180, max: 180, section: "Contact" },
  { name: "media_contact_name", label: "Media contact name", type: "text", section: "Media desk" },
  { name: "media_contact_email", label: "Media contact email", type: "email", section: "Media desk" },
  { name: "media_contact_phone", label: "Media contact phone", type: "text", section: "Media desk" },
  { name: "facebook_url", label: "Facebook", type: "url", section: "Social media" },
  { name: "linkedin_url", label: "LinkedIn", type: "url", section: "Social media" },
  { name: "youtube_url", label: "YouTube", type: "url", section: "Social media" },
  { name: "x_url", label: "X (Twitter)", type: "url", section: "Social media" },
  { name: "bsrb_url", label: "Bangladesh Ship Recycling Board website", type: "url", section: "Regulator", help: "Shown on the homepage, links page and footer." },
  { name: "announcement", label: "Homepage announcement", type: "text", bilingual: true, wide: true, section: "Announcement", help: "Leave empty to hide the announcement bar." },
  { name: "announcement_url", label: "Announcement link", type: "text", section: "Announcement", placeholder: "/industry" },
];
