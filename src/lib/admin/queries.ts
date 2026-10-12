import "server-only";
import { isPreviewMode } from "@/lib/env";
import { viewerReader } from "@/lib/data/readers";
import { createServerSupabase } from "@/lib/supabase/server";
import { fixtures } from "@/lib/demo";
import type { AuditEntry, Profile, TableName } from "@/lib/types";
import type { Filter } from "@/lib/data/backend";
import type { Option, ResourceConfig } from "./resources";

type Row = Record<string, unknown> & { id: string };

export interface ListParams {
  q?: string;
  filters?: Record<string, string>;
  sort?: string;
  dir?: "asc" | "desc";
  page?: number;
  pageSize?: number;
}

/** Paginated, searchable list for an admin resource (runs as the signed-in staff member). */
export async function listRecords(resource: ResourceConfig, params: ListParams) {
  const reader = await viewerReader();
  const pageSize = params.pageSize ?? 25;
  const page = Math.max(1, params.page ?? 1);
  const filters: Filter[] = [];
  for (const f of resource.filters ?? []) {
    const value = params.filters?.[f.name];
    if (value && f.options.some((o) => o.value === value)) filters.push({ col: f.name, op: "eq", value });
  }
  const sortable = new Set(resource.columns.map((c) => c.name).concat(resource.defaultSort.col));
  const sortCol = params.sort && sortable.has(params.sort) ? params.sort : resource.defaultSort.col;
  const ascending = params.sort && sortable.has(params.sort) ? params.dir !== "desc" : resource.defaultSort.ascending !== false;

  const result = await reader.list({
    table: resource.table,
    filters,
    search: params.q && resource.search.length ? { columns: resource.search, term: params.q } : undefined,
    order: [{ col: sortCol, ascending }, ...(sortCol !== "id" ? [{ col: "id" }] : [])],
    limit: pageSize,
    offset: (page - 1) * pageSize,
    count: true,
  });
  return { rows: result.rows as unknown as Row[], count: result.count, page, pageSize, sortCol, ascending };
}

export async function getRecord(resource: ResourceConfig, id: string): Promise<Row | null> {
  if (!/^[0-9a-f-]{36}$/i.test(id)) return null;
  const reader = await viewerReader();
  return (await reader.first(resource.table, [{ col: "id", op: "eq", value: id }])) as unknown as Row | null;
}

/** id → label maps for every relation field of a resource. */
export async function relationOptions(resource: ResourceConfig): Promise<Record<string, Option[]>> {
  const reader = await viewerReader();
  const out: Record<string, Option[]> = {};
  for (const field of resource.fields) {
    if (field.type !== "relation" || !field.relation) continue;
    const { table, label, order } = field.relation;
    const { rows } = await reader.list({
      table,
      columns: `id, ${label}`,
      order: [{ col: order ?? label }],
      limit: 2000,
    });
    out[field.name] = (rows as unknown as Row[]).map((r) => ({ value: r.id, label: String(r[label] ?? r.id) }));
  }
  return out;
}

export async function countRows(table: TableName, filters: Filter[] = []): Promise<number> {
  const reader = await viewerReader();
  const { count } = await reader.list({ table, columns: "id", filters, limit: 1, count: true });
  return count;
}

export interface AuditQuery {
  table?: string;
  recordId?: string;
  action?: string;
  actor?: string;
  from?: string;
  to?: string;
  page?: number;
  pageSize?: number;
}

export async function listAudit(query: AuditQuery): Promise<{ rows: AuditEntry[]; count: number }> {
  const reader = await viewerReader();
  const filters: Filter[] = [];
  if (query.table) filters.push({ col: "table_name", op: "eq", value: query.table });
  if (query.recordId) filters.push({ col: "record_id", op: "eq", value: query.recordId });
  if (query.action) filters.push({ col: "action", op: "eq", value: query.action });
  if (query.from) filters.push({ col: "occurred_at", op: "gte", value: `${query.from}T00:00:00+06:00` });
  if (query.to) filters.push({ col: "occurred_at", op: "lte", value: `${query.to}T23:59:59+06:00` });
  const pageSize = query.pageSize ?? 50;
  const page = Math.max(1, query.page ?? 1);
  return reader.list({
    table: "audit_log",
    filters,
    search: query.actor ? { columns: ["actor_email", "record_label"], term: query.actor } : undefined,
    order: [{ col: "occurred_at", ascending: false }],
    limit: pageSize,
    offset: (page - 1) * pageSize,
    count: true,
  });
}

export async function listProfiles(params: { q?: string; role?: string; page?: number }): Promise<{ rows: Profile[]; count: number }> {
  const reader = await viewerReader();
  const filters: Filter[] = params.role ? [{ col: "role", op: "eq", value: params.role }] : [];
  const page = Math.max(1, params.page ?? 1);
  return reader.list({
    table: "profiles",
    filters,
    search: params.q ? { columns: ["email", "full_name", "organization"], term: params.q } : undefined,
    order: [{ col: "created_at", ascending: false }],
    limit: 50,
    offset: (page - 1) * 50,
    count: true,
  });
}

/** Unread contact messages, for the sidebar badge. */
export async function unreadMessages(): Promise<number> {
  try {
    return await countRows("contact_messages", [{ col: "status", op: "eq", value: "new" }]);
  } catch {
    return 0;
  }
}

/** Download totals for documents (public table). */
export async function documentDownloads(): Promise<Map<string, number>> {
  if (isPreviewMode) return new Map(fixtures.documents.map((d, i) => [d.id, (i * 37) % 120]));
  const supabase = await createServerSupabase();
  const { data } = await supabase.from("document_stats").select("document_id, downloads");
  return new Map((data ?? []).map((r) => [r.document_id as string, Number(r.downloads)]));
}
