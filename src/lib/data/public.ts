import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import { isPreviewMode } from "@/lib/env";
import { getPublicSupabase } from "@/lib/supabase/public";
import { fixtures } from "@/lib/demo";
import { siteSettings as fallbackSettings } from "@/lib/demo/content";
import type {
  Album,
  ComplianceItem,
  DocumentCategory,
  DocumentRecord,
  Page,
  Photo,
  Post,
  PostType,
  SearchHit,
  SiteSettings,
  TideEntry,
  Vessel,
  VesselStatus,
  VesselType,
  Yard,
  YardStatus,
} from "@/lib/types";
import { cleanSearchTerm, type Filter } from "./backend";
import { publicReader } from "./readers";

/**
 * Public, cache-friendly queries. Every function runs as an anonymous visitor
 * and is wrapped in `"use cache"`, so results join the static shell and are
 * refreshed when the admin panel calls updateTag(<table>) after a change.
 */

export const POST_GROUPS = {
  newsroom: [
    "news", "industry_update", "activity", "event", "meeting", "seminar",
    "workshop", "announcement", "press_release",
  ] as PostType[],
  press: ["press_release", "media_coverage", "tv_report", "statement", "interview"] as PostType[],
  international: ["international"] as PostType[],
  csr: ["csr"] as PostType[],
  events: ["event", "meeting", "seminar", "workshop"] as PostType[],
};

// ---------------------------------------------------------------------------
// Settings & pages
// ---------------------------------------------------------------------------
export async function getSiteSettings(): Promise<SiteSettings> {
  "use cache";
  cacheTag("site_settings");
  // The header and footer depend on these settings, so a database outage falls
  // back to defaults (cached only briefly) instead of taking the whole site down.
  try {
    const row = await publicReader().first("site_settings", [{ col: "id", op: "eq", value: 1 }]);
    cacheLife("hours");
    return row ?? fallbackSettings;
  } catch (error) {
    console.error("[site_settings] falling back to defaults:", error instanceof Error ? error.message : error);
    cacheLife("seconds");
    return fallbackSettings;
  }
}

export async function getPage(slug: string): Promise<Page | null> {
  "use cache";
  cacheLife("hours");
  cacheTag("pages");
  return publicReader().first("pages", [{ col: "slug", op: "eq", value: slug }]);
}

export async function getPagesWithPrefix(prefix: string): Promise<Page[]> {
  "use cache";
  cacheLife("hours");
  cacheTag("pages");
  const { rows } = await publicReader().list({
    table: "pages",
    filters: [{ col: "slug", op: "prefix", value: prefix }],
    order: [{ col: "sort_order" }],
  });
  return rows;
}

// ---------------------------------------------------------------------------
// Newsroom
// ---------------------------------------------------------------------------
export interface PostQuery {
  types: PostType[];
  type?: PostType | null;
  csrArea?: string | null;
  page?: number;
  pageSize?: number;
}

export async function getPosts(query: PostQuery): Promise<{ rows: Post[]; count: number }> {
  "use cache";
  cacheLife("hours");
  cacheTag("posts");
  const pageSize = query.pageSize ?? 12;
  const page = Math.max(1, query.page ?? 1);
  const filters: Filter[] = [
    query.type && query.types.includes(query.type)
      ? { col: "type", op: "eq", value: query.type }
      : { col: "type", op: "in", value: query.types },
  ];
  if (query.csrArea) filters.push({ col: "csr_area", op: "eq", value: query.csrArea });
  return publicReader().list({
    table: "posts",
    filters,
    order: [{ col: "published_at", ascending: false }],
    limit: pageSize,
    offset: (page - 1) * pageSize,
    count: true,
  });
}

export async function getLatestPosts(types: PostType[], limit = 6, excludeSlug?: string): Promise<Post[]> {
  "use cache";
  cacheLife("hours");
  cacheTag("posts");
  const filters: Filter[] = [{ col: "type", op: "in", value: types }];
  if (excludeSlug) filters.push({ col: "slug", op: "neq", value: excludeSlug });
  const { rows } = await publicReader().list({
    table: "posts",
    filters,
    order: [{ col: "published_at", ascending: false }],
    limit,
  });
  return rows;
}

export async function getPost(slug: string): Promise<Post | null> {
  "use cache";
  cacheLife("hours");
  cacheTag("posts");
  return publicReader().first("posts", [{ col: "slug", op: "eq", value: slug }]);
}

export async function getUpcomingEvents(limit = 3): Promise<Post[]> {
  "use cache";
  cacheLife("hours");
  cacheTag("posts");
  const { rows } = await publicReader().list({
    table: "posts",
    filters: [
      { col: "type", op: "in", value: POST_GROUPS.events },
      { col: "event_date", op: "gte", value: new Date().toISOString() },
    ],
    order: [{ col: "event_date", ascending: true }],
    limit,
  });
  return rows;
}

export async function getPostSlugs(limit = 20): Promise<string[]> {
  "use cache";
  cacheLife("hours");
  cacheTag("posts");
  const { rows } = await publicReader().list({
    table: "posts",
    columns: "slug",
    order: [{ col: "published_at", ascending: false }],
    limit,
  });
  return rows.map((r) => r.slug);
}

// ---------------------------------------------------------------------------
// Leadership
// ---------------------------------------------------------------------------
const LEADERSHIP_PHOTO_MAP: Record<string, string> = {
  // Current Committee & Advisors
  "Mohammad Mohsin Chowdhury": "/photos/mohammed-mohsin-chowdhury.jpg",
  "Alhaj Showkat Ali Chowdhury": "/photos/showkat-ali-chowdhury.jpg",
  "Md. Showkat Ali Chowdhury": "/photos/showkat-ali-chowdhury.jpg",
  // Past Presidents
  "Mohammed Zahirul Islam (Rinku)": "/photos/mohammed-zahirul-islam.jpg",
  "Mohammad Zahirul Islam": "/photos/mohammed-zahirul-islam.jpg",
  "Alhaj Mohammad Abu Taher": "/photos/alhaj-mohammad-abu-taher.jpg",
  "Mohammad Abu Taher": "/photos/alhaj-mohammad-abu-taher.jpg",
  "Alhaj Md. Shahjahan": "/photos/alhaj-md-shahjahan.jpg",
  "Md. Shahjahan": "/photos/alhaj-md-shahjahan.jpg",
};

export async function getCommittee() {
  "use cache";
  cacheLife("hours");
  cacheTag("committee_members");
  const { rows } = await publicReader().list({
    table: "committee_members",
    filters: [{ col: "is_current", op: "eq", value: true }],
    order: [{ col: "sort_order" }, { col: "name_en" }],
  });
  return rows.map((m) => ({
    ...m,
    photo: m.photo ?? LEADERSHIP_PHOTO_MAP[m.name_en] ?? null,
  }));
}

export async function getPastPresidents() {
  "use cache";
  cacheLife("hours");
  cacheTag("past_presidents");
  const { rows } = await publicReader().list({
    table: "past_presidents",
    order: [{ col: "term_start", ascending: false }, { col: "sort_order" }],
  });
  return rows.map((p) => ({
    ...p,
    photo: p.photo ?? LEADERSHIP_PHOTO_MAP[p.name_en] ?? null,
  }));
}

// ---------------------------------------------------------------------------
// Statistics
// ---------------------------------------------------------------------------
export async function getIndustryStatistics() {
  "use cache";
  cacheLife("hours");
  cacheTag("industry_statistics");
  const { rows } = await publicReader().list({ table: "industry_statistics", order: [{ col: "year" }] });
  return rows;
}

export async function getLabourStatistics() {
  "use cache";
  cacheLife("hours");
  cacheTag("labour_statistics");
  const { rows } = await publicReader().list({ table: "labour_statistics", order: [{ col: "year" }] });
  return rows;
}

// ---------------------------------------------------------------------------
// Yards & vessels
// ---------------------------------------------------------------------------
const YARD_PHOTO_MAP: Record<string, { cover: string; gallery: string[] }> = {
  "php-ship-breaking-recycling": {
    cover: "/photos/imo-green-yard.jpg",
    gallery: ["/photos/imo-green-yard.jpg", "/photos/imo-green-recycling-sustainable.jpg", "/photos/bulk-carrier-recycling.jpg"],
  },
  "kabir-steel": {
    cover: "/photos/ksrm-yard-visit-2025.jpg",
    gallery: ["/photos/ksrm-yard-visit-2025.jpg", "/photos/sitakunda-cranes.jpg", "/photos/chattogram-yard.jpg"],
  },
  "sn-corporation-unit-1": {
    cover: "/photos/bulk-carrier-recycling.jpg",
    gallery: ["/photos/bulk-carrier-recycling.jpg", "/photos/chattogram-yard.jpg", "/photos/beached-bow.jpg"],
  },
  "kr-ship-recycling-yard": {
    cover: "/photos/imo-green-recycling-sustainable.jpg",
    gallery: ["/photos/imo-green-recycling-sustainable.jpg", "/photos/sitakunda-cranes.jpg", "/photos/bhatiary-gas-cutting.jpg"],
  },
  "arab-ship-breaking-recycling": {
    cover: "/photos/sitakunda-cranes.jpg",
    gallery: ["/photos/sitakunda-cranes.jpg", "/photos/bulk-carrier-recycling.jpg", "/photos/sitakunda-sunset.jpg"],
  },
  "hm-shipping-lines": {
    cover: "/photos/chittagong-demolition-yard.jpg",
    gallery: ["/photos/chittagong-demolition-yard.jpg", "/photos/shipbreaking-bangladesh-yard.jpg", "/photos/beached-bow.jpg"],
  },
  "sn-corporation-unit-2": {
    cover: "/photos/chattogram-yard.jpg",
    gallery: ["/photos/chattogram-yard.jpg", "/photos/bulk-carrier-recycling.jpg", "/photos/jafrabad-shipbreaking-1.jpg"],
  },
  "sn-corporation-unit-3": {
    cover: "/photos/beached-bow.jpg",
    gallery: ["/photos/beached-bow.jpg", "/photos/jafrabad-shipbreaking-5.jpg", "/photos/sitakunda-cranes.jpg"],
  },
  "ferdous-steel-ship-recycling": {
    cover: "/photos/ziri-subedar-inspection-1.jpg",
    gallery: ["/photos/ziri-subedar-inspection-1.jpg", "/photos/ziri-subedar-inspection-2.jpg", "/photos/bhatiary-gas-cutting.jpg"],
  },
  "nb-steel": {
    cover: "/photos/jafrabad-shipbreaking-1.jpg",
    gallery: ["/photos/jafrabad-shipbreaking-1.jpg", "/photos/jafrabad-shipbreaking-5.jpg", "/photos/chattogram-yard.jpg"],
  },
  "mak-corporation": {
    cover: "/photos/bhatiary-gas-cutting.jpg",
    gallery: ["/photos/bhatiary-gas-cutting.jpg", "/photos/sitakunda-cranes.jpg", "/photos/sitakunda-sunset.jpg"],
  },
  "kr-steel": {
    cover: "/photos/jafrabad-shipbreaking-5.jpg",
    gallery: ["/photos/jafrabad-shipbreaking-5.jpg", "/photos/imo-green-recycling-sustainable.jpg", "/photos/chattogram-yard.jpg"],
  },
  "jamuna-ship-breakers": {
    cover: "/photos/shipbreaking-bangladesh-yard.jpg",
    gallery: ["/photos/shipbreaking-bangladesh-yard.jpg", "/photos/beached-bow.jpg", "/photos/sitakunda-cranes.jpg"],
  },
  "janata-steel": {
    cover: "/photos/ziri-subedar-inspection-2.jpg",
    gallery: ["/photos/ziri-subedar-inspection-2.jpg", "/photos/ziri-subedar-inspection-1.jpg", "/photos/bhatiary-gas-cutting.jpg"],
  },
  "taher-and-company": {
    cover: "/photos/sitakunda-sunset.jpg",
    gallery: ["/photos/sitakunda-sunset.jpg", "/photos/sitakunda-cranes.jpg", "/photos/beached-bow.jpg"],
  },
  "bob-recyclers": {
    cover: "/photos/bow-monochrome.jpg",
    gallery: ["/photos/bow-monochrome.jpg", "/photos/chattogram-yard.jpg", "/photos/chittagong-demolition-yard.jpg"],
  },
  "asadi-steel-enterprise": {
    cover: "/photos/sitakunda-coast-aster.jpg",
    gallery: ["/photos/sitakunda-coast-aster.jpg", "/photos/imo-green-yard.jpg", "/photos/bulk-carrier-recycling.jpg"],
  },
};

function sanitizeYardRecord(yard: Yard): Yard {
  const isSvgOrArt = !yard.cover_image || yard.cover_image.includes("/art/") || yard.cover_image.endsWith(".svg");
  const fallback = YARD_PHOTO_MAP[yard.slug];
  const cover_image = isSvgOrArt ? (fallback?.cover ?? "/photos/imo-green-yard.jpg") : yard.cover_image;
  const gallery = (!yard.gallery || yard.gallery.length === 0 || yard.gallery.some((g) => g.includes("/art/")))
    ? (fallback?.gallery ?? [cover_image])
    : yard.gallery;
  return { ...yard, cover_image, gallery };
}

export async function getYards(statuses?: YardStatus[]): Promise<Yard[]> {
  "use cache";
  cacheLife("hours");
  cacheTag("yards");
  const { rows } = await publicReader().list({
    table: "yards",
    filters: statuses?.length ? [{ col: "status", op: "in", value: statuses }] : [],
    order: [{ col: "sort_order" }, { col: "name_en" }],
  });
  return rows.map(sanitizeYardRecord);
}

export async function getYard(slug: string): Promise<Yard | null> {
  "use cache";
  cacheLife("hours");
  cacheTag("yards");
  const row = await publicReader().first("yards", [{ col: "slug", op: "eq", value: slug }]);
  return row ? sanitizeYardRecord(row) : null;
}

export interface YardSummary {
  yard_id: string;
  vessels: number;
  total_ldt: number;
  last_beaching: string | null;
}

export async function getYardSummaries(): Promise<YardSummary[]> {
  "use cache";
  cacheLife("hours");
  cacheTag("vessels", "yards");
  if (!isPreviewMode) {
    const { data, error } = await getPublicSupabase()
      .from("yard_vessel_summary")
      .select("yard_id, vessels, total_ldt, last_beaching");
    if (error) throw new Error(error.message);
    return (data ?? []).map((r) => ({ ...r, total_ldt: Number(r.total_ldt) }));
  }
  const map = new Map<string, YardSummary>();
  for (const v of fixtures.vessels) {
    if (!v.yard_id) continue;
    const s = map.get(v.yard_id) ?? { yard_id: v.yard_id, vessels: 0, total_ldt: 0, last_beaching: null };
    s.vessels += 1;
    s.total_ldt += v.ldt ?? 0;
    if (v.beaching_date && (!s.last_beaching || v.beaching_date > s.last_beaching)) s.last_beaching = v.beaching_date;
    map.set(v.yard_id, s);
  }
  return [...map.values()];
}

export interface VesselQuery {
  q?: string;
  yard?: string | null;
  type?: VesselType | null;
  year?: number | null;
  status?: VesselStatus | null;
  page?: number;
  pageSize?: number;
}

function vesselFilters(query: VesselQuery): Filter[] {
  const filters: Filter[] = [];
  if (query.yard) filters.push({ col: "yard_id", op: "eq", value: query.yard });
  if (query.type) filters.push({ col: "vessel_type", op: "eq", value: query.type });
  if (query.year) filters.push({ col: "recycling_year", op: "eq", value: query.year });
  if (query.status) filters.push({ col: "status", op: "eq", value: query.status });
  return filters;
}

const VESSEL_SEARCH = ["vessel_name", "imo_number", "flag", "former_names"];

export async function getVessels(query: VesselQuery): Promise<{ rows: Vessel[]; count: number; totalLdt: number }> {
  "use cache";
  cacheLife("hours");
  cacheTag("vessels");
  const pageSize = query.pageSize ?? 25;
  const page = Math.max(1, query.page ?? 1);
  const reader = publicReader();
  const base = {
    table: "vessels" as const,
    filters: vesselFilters(query),
    search: query.q ? { columns: VESSEL_SEARCH, term: query.q } : undefined,
  };
  const [pageResult, ldtResult] = await Promise.all([
    reader.list({
      ...base,
      order: [{ col: "beaching_date", ascending: false }, { col: "vessel_name" }],
      limit: pageSize,
      offset: (page - 1) * pageSize,
      count: true,
    }),
    reader.list({ ...base, columns: "ldt", limit: 5000 }),
  ]);
  const totalLdt = ldtResult.rows.reduce((acc, r) => acc + Number(r.ldt ?? 0), 0);
  return { rows: pageResult.rows, count: pageResult.count, totalLdt };
}

/** Up to 5,000 rows for CSV export — always within the visitor's RLS view. */
export async function getVesselsForExport(query: VesselQuery): Promise<Vessel[]> {
  const { rows } = await publicReader().list({
    table: "vessels",
    filters: vesselFilters(query),
    search: query.q ? { columns: VESSEL_SEARCH, term: query.q } : undefined,
    order: [{ col: "beaching_date", ascending: false }],
    limit: 5000,
  });
  return rows;
}

export async function getYardVessels(yardId: string, limit = 8): Promise<Vessel[]> {
  "use cache";
  cacheLife("hours");
  cacheTag("vessels");
  const { rows } = await publicReader().list({
    table: "vessels",
    filters: [{ col: "yard_id", op: "eq", value: yardId }],
    order: [{ col: "beaching_date", ascending: false }],
    limit,
  });
  return rows;
}

export interface VesselTypeSummary {
  vessel_type: VesselType;
  vessels: number;
  total_ldt: number;
}

export async function getVesselTypeSummary(): Promise<VesselTypeSummary[]> {
  "use cache";
  cacheLife("hours");
  cacheTag("vessels");
  if (!isPreviewMode) {
    const { data, error } = await getPublicSupabase().from("vessel_type_summary").select("*");
    if (error) throw new Error(error.message);
    return (data ?? []).map((r) => ({ ...r, total_ldt: Number(r.total_ldt) })) as VesselTypeSummary[];
  }
  const map = new Map<VesselType, VesselTypeSummary>();
  for (const v of fixtures.vessels) {
    const s = map.get(v.vessel_type) ?? { vessel_type: v.vessel_type, vessels: 0, total_ldt: 0 };
    s.vessels += 1;
    s.total_ldt += v.ldt ?? 0;
    map.set(v.vessel_type, s);
  }
  return [...map.values()].sort((a, b) => b.vessels - a.vessels);
}

export async function getVesselYears(): Promise<number[]> {
  "use cache";
  cacheLife("hours");
  cacheTag("vessels");
  if (!isPreviewMode) {
    const { data, error } = await getPublicSupabase().from("vessel_year_summary").select("year").order("year", { ascending: false });
    if (error) throw new Error(error.message);
    return (data ?? []).map((r) => Number(r.year));
  }
  return [...new Set(fixtures.vessels.map((v) => v.recycling_year).filter((y): y is number => !!y))].sort((a, b) => b - a);
}

// ---------------------------------------------------------------------------
// Tides
// ---------------------------------------------------------------------------
export async function getTideEntries(from: string, to: string): Promise<TideEntry[]> {
  "use cache";
  cacheLife("days");
  cacheTag("tide_entries");
  const { rows } = await publicReader().list({
    table: "tide_entries",
    filters: [
      { col: "tide_date", op: "gte", value: from },
      { col: "tide_date", op: "lte", value: to },
    ],
    order: [{ col: "tide_date" }, { col: "tide_time" }],
    limit: 400,
  });
  return rows;
}

export async function getTideBounds(): Promise<{ first: string | null; last: string | null }> {
  "use cache";
  cacheLife("days");
  cacheTag("tide_entries");
  const reader = publicReader();
  const [first, last] = await Promise.all([
    reader.list({ table: "tide_entries", columns: "tide_date", order: [{ col: "tide_date" }], limit: 1 }),
    reader.list({ table: "tide_entries", columns: "tide_date", order: [{ col: "tide_date", ascending: false }], limit: 1 }),
  ]);
  return { first: first.rows[0]?.tide_date ?? null, last: last.rows[0]?.tide_date ?? null };
}

// ---------------------------------------------------------------------------
// Compliance, links, gallery
// ---------------------------------------------------------------------------
export async function getComplianceItems(): Promise<ComplianceItem[]> {
  "use cache";
  cacheLife("hours");
  cacheTag("compliance_items");
  const { rows } = await publicReader().list({
    table: "compliance_items",
    order: [{ col: "sort_order" }, { col: "title_en" }],
  });
  return rows;
}

export async function getLinks() {
  "use cache";
  cacheLife("hours");
  cacheTag("links");
  const { rows } = await publicReader().list({
    table: "links",
    order: [{ col: "sort_order" }, { col: "title_en" }],
  });
  return rows;
}

export async function getAlbums(): Promise<(Album & { photo_count: number })[]> {
  "use cache";
  cacheLife("hours");
  cacheTag("albums", "photos");
  const reader = publicReader();
  const [{ rows: albums }, { rows: photos }] = await Promise.all([
    reader.list({ table: "albums", order: [{ col: "event_date", ascending: false }, { col: "sort_order" }] }),
    reader.list({ table: "photos", columns: "album_id", limit: 5000 }),
  ]);
  const counts = new Map<string, number>();
  for (const p of photos) counts.set(p.album_id, (counts.get(p.album_id) ?? 0) + 1);
  return albums.map((a) => ({ ...a, photo_count: counts.get(a.id) ?? 0 }));
}

export async function getAlbum(slug: string): Promise<{ album: Album; photos: Photo[] } | null> {
  "use cache";
  cacheLife("hours");
  cacheTag("albums", "photos");
  const reader = publicReader();
  const album = await reader.first("albums", [{ col: "slug", op: "eq", value: slug }]);
  if (!album) return null;
  const { rows } = await reader.list({
    table: "photos",
    filters: [{ col: "album_id", op: "eq", value: album.id }],
    order: [{ col: "sort_order" }],
  });
  return { album, photos: rows };
}

// ---------------------------------------------------------------------------
// Publications
// ---------------------------------------------------------------------------
export interface DocumentQuery {
  q?: string;
  category?: DocumentCategory | null;
  year?: number | null;
  page?: number;
  pageSize?: number;
}

export async function getPublicDocuments(query: DocumentQuery): Promise<{ rows: DocumentRecord[]; count: number }> {
  "use cache";
  cacheLife("hours");
  cacheTag("documents");
  const pageSize = query.pageSize ?? 15;
  const page = Math.max(1, query.page ?? 1);
  const filters: Filter[] = [];
  if (query.category) filters.push({ col: "category", op: "eq", value: query.category });
  if (query.year) filters.push({ col: "year", op: "eq", value: query.year });
  return publicReader().list({
    table: "documents",
    filters,
    search: query.q ? { columns: ["title_en", "title_bn", "description_en", "description_bn"], term: query.q } : undefined,
    order: [{ col: "published_on", ascending: false }, { col: "year", ascending: false }, { col: "title_en" }],
    limit: pageSize,
    offset: (page - 1) * pageSize,
    count: true,
  });
}

export async function getDocumentYears(): Promise<number[]> {
  "use cache";
  cacheLife("hours");
  cacheTag("documents");
  const { rows } = await publicReader().list({ table: "documents", columns: "year", limit: 2000 });
  return [...new Set(rows.map((r) => r.year).filter((y): y is number => !!y))].sort((a, b) => b - a);
}

// ---------------------------------------------------------------------------
// Global search
// ---------------------------------------------------------------------------
export async function searchSite(term: string): Promise<SearchHit[]> {
  "use cache";
  cacheLife("hours");
  cacheTag("search");
  const q = term.trim();
  if (q.length < 2) return [];

  if (!isPreviewMode) {
    const { data, error } = await getPublicSupabase().rpc("global_search", { q, max_results: 40 });
    if (error) throw new Error(error.message);
    return (data ?? []) as SearchHit[];
  }

  const needle = cleanSearchTerm(q).toLowerCase();
  const has = (...values: (string | null | undefined)[]) => values.some((v) => v?.toLowerCase().includes(needle));
  const rank = (title: string, titleBn?: string | null) => (has(title, titleBn) ? 2 : 1);
  const reader = publicReader();
  const [posts, pages, docs, yards, vessels, items] = await Promise.all([
    reader.list({ table: "posts" }),
    reader.list({ table: "pages" }),
    reader.list({ table: "documents" }),
    reader.list({ table: "yards" }),
    reader.list({ table: "vessels" }),
    reader.list({ table: "compliance_items" }),
  ]);

  const hits: SearchHit[] = [
    ...posts.rows
      .filter((p) => has(p.title_en, p.title_bn, p.excerpt_en, p.excerpt_bn, p.body_en, p.body_bn))
      .map((p) => ({ kind: "post" as const, id: p.id, slug: p.slug, title_en: p.title_en, title_bn: p.title_bn, snippet_en: p.excerpt_en, snippet_bn: p.excerpt_bn, meta: p.type, rank: rank(p.title_en, p.title_bn) })),
    ...pages.rows
      .filter((p) => has(p.title_en, p.title_bn, p.summary_en, p.summary_bn, p.body_en, p.body_bn))
      .map((p) => ({ kind: "page" as const, id: p.id, slug: p.slug, title_en: p.title_en, title_bn: p.title_bn, snippet_en: p.summary_en, snippet_bn: p.summary_bn, meta: null, rank: rank(p.title_en, p.title_bn) })),
    ...docs.rows
      .filter((d) => has(d.title_en, d.title_bn, d.description_en, d.description_bn))
      .map((d) => ({ kind: "document" as const, id: d.id, slug: null, title_en: d.title_en, title_bn: d.title_bn, snippet_en: d.description_en, snippet_bn: d.description_bn, meta: `${d.category}${d.year ? ` · ${d.year}` : ""}`, rank: rank(d.title_en, d.title_bn) })),
    ...yards.rows
      .filter((y) => has(y.name_en, y.name_bn, y.owner_company, y.address_en, y.address_bn))
      .map((y) => ({ kind: "yard" as const, id: y.id, slug: y.slug, title_en: y.name_en, title_bn: y.name_bn, snippet_en: y.address_en, snippet_bn: y.address_bn, meta: y.status, rank: rank(y.name_en, y.name_bn) })),
    ...vessels.rows
      .filter((v) => has(v.vessel_name, v.former_names, v.flag) || v.imo_number === q)
      .map((v) => ({ kind: "vessel" as const, id: v.id, slug: null, title_en: v.vessel_name, title_bn: null, snippet_en: [v.imo_number && `IMO ${v.imo_number}`, v.flag, v.recycling_year].filter(Boolean).join(" · "), snippet_bn: null, meta: v.vessel_type, rank: rank(v.vessel_name) })),
    ...items.rows
      .filter((c) => has(c.title_en, c.title_bn, c.summary_en, c.summary_bn))
      .map((c) => ({ kind: "compliance" as const, id: c.id, slug: null, title_en: c.title_en, title_bn: c.title_bn, snippet_en: c.summary_en, snippet_bn: c.summary_bn, meta: c.category, rank: rank(c.title_en, c.title_bn) })),
  ];
  return hits.sort((a, b) => b.rank - a.rank || a.title_en.localeCompare(b.title_en)).slice(0, 40);
}

// ---------------------------------------------------------------------------
// Detail lookups & static params
// ---------------------------------------------------------------------------
export async function getVessel(id: string): Promise<Vessel | null> {
  "use cache";
  cacheLife("hours");
  cacheTag("vessels");
  if (!/^[0-9a-f-]{36}$/i.test(id)) return null;
  return publicReader().first("vessels", [{ col: "id", op: "eq", value: id }]);
}

export async function getStaticIds(table: "vessels" | "yards" | "albums" | "posts", column: "id" | "slug", limit = 12): Promise<string[]> {
  "use cache";
  cacheLife("hours");
  cacheTag(table);
  const { rows } = await publicReader().list({ table, columns: column, limit });
  return rows.map((r) => String((r as unknown as Record<string, unknown>)[column]));
}
