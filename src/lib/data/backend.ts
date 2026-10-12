import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { AccessLevel, Role, TableName, Tables } from "@/lib/types";
import { fixtures } from "@/lib/demo";
import { canView, isAdmin, isEditor, isStaff } from "@/lib/auth/permissions";

/**
 * A tiny query description that runs against either Supabase (PostgREST,
 * protected by Row Level Security) or the bundled preview fixtures (where
 * the same visibility rules are emulated in code). Pages are written once
 * against this interface and work in both modes.
 */

type Scalar = string | number | boolean;

export type Filter =
  | { col: string; op: "eq" | "neq" | "gt" | "gte" | "lt" | "lte"; value: Scalar }
  | { col: string; op: "in"; value: Scalar[] }
  | { col: string; op: "is"; value: null | boolean }
  | { col: string; op: "not_null" }
  | { col: string; op: "prefix"; value: string };

export interface ListQuery<T extends TableName = TableName> {
  table: T;
  columns?: string;
  filters?: Filter[];
  search?: { columns: string[]; term: string };
  order?: { col: string; ascending?: boolean }[];
  limit?: number;
  offset?: number;
  count?: boolean;
}

export interface ListResult<R> {
  rows: R[];
  count: number;
}

export interface Reader {
  list<T extends TableName>(query: ListQuery<T>): Promise<ListResult<Tables[T]>>;
  first<T extends TableName>(table: T, filters: Filter[]): Promise<Tables[T] | null>;
}

/** Strips characters that carry meaning in PostgREST filter syntax. */
export function cleanSearchTerm(term: string): string {
  return term.replace(/[,()"\\%_*:]/g, " ").replace(/\s+/g, " ").trim().slice(0, 100);
}

// ---------------------------------------------------------------------------
// Supabase
// ---------------------------------------------------------------------------
export function supabaseReader(client: SupabaseClient): Reader {
  return {
    async list<T extends TableName>(query: ListQuery<T>) {
      let q = client
        .from(query.table)
        .select(query.columns ?? "*", query.count ? { count: "exact" } : undefined);

      for (const f of query.filters ?? []) {
        switch (f.op) {
          case "in":
            q = q.in(f.col, f.value);
            break;
          case "is":
            q = q.is(f.col, f.value);
            break;
          case "not_null":
            q = q.not(f.col, "is", null);
            break;
          case "prefix":
            q = q.like(f.col, `${f.value.replace(/[%_]/g, "")}%`);
            break;
          case "eq":
            q = q.eq(f.col, f.value);
            break;
          case "neq":
            q = q.neq(f.col, f.value);
            break;
          case "gt":
            q = q.gt(f.col, f.value);
            break;
          case "gte":
            q = q.gte(f.col, f.value);
            break;
          case "lt":
            q = q.lt(f.col, f.value);
            break;
          case "lte":
            q = q.lte(f.col, f.value);
        }
      }

      const term = query.search ? cleanSearchTerm(query.search.term) : "";
      if (term && query.search) {
        q = q.or(query.search.columns.map((c) => `${c}.ilike.*${term}*`).join(","));
      }

      for (const o of query.order ?? []) {
        q = q.order(o.col, { ascending: o.ascending ?? true, nullsFirst: false });
      }

      if (query.limit !== undefined) {
        const from = query.offset ?? 0;
        q = q.range(from, from + query.limit - 1);
      }

      const { data, error, count } = await q;
      if (error) throw new Error(`[${query.table}] ${error.message}`);
      const rows = (data ?? []) as unknown as Tables[T][];
      return { rows, count: count ?? rows.length };
    },

    async first<T extends TableName>(table: T, filters: Filter[]) {
      const { rows } = await this.list({ table, filters, limit: 1 });
      return rows[0] ?? null;
    },
  };
}

// ---------------------------------------------------------------------------
// Preview fixtures
// ---------------------------------------------------------------------------
type AnyRow = Record<string, unknown>;

/** Mirrors the SELECT policies in supabase/migrations/…_security.sql. */
function visible(table: TableName, row: AnyRow, role: Role | null): boolean {
  switch (table) {
    case "pages":
    case "posts":
    case "documents":
      return isStaff(role) || (row.status === "published" && canView(row.access_level as AccessLevel, role));
    case "meeting_minutes":
      return isAdmin(role) || (row.status === "approved" && canView(row.access_level as AccessLevel, role));
    case "members":
      return canView("members", role);
    case "photos": {
      if (isStaff(role)) return true;
      const album = fixtures.albums.find((a) => a.id === row.album_id);
      return Boolean(album?.is_published);
    }
    case "profiles":
      return isAdmin(role);
    case "contact_messages":
      return isEditor(role);
    case "audit_log":
      return isAdmin(role);
    case "tide_entries":
    case "site_settings":
      return true;
    default:
      return isStaff(role) || row.is_published !== false;
  }
}

function compare(a: unknown, b: unknown): number {
  if (a === b) return 0;
  if (a === null || a === undefined) return 1;
  if (b === null || b === undefined) return -1;
  if (typeof a === "number" && typeof b === "number") return a - b;
  if (typeof a === "boolean" && typeof b === "boolean") return Number(a) - Number(b);
  return String(a).localeCompare(String(b));
}

function matches(row: AnyRow, f: Filter): boolean {
  const v = row[f.col];
  switch (f.op) {
    case "eq":
      return v === f.value;
    case "neq":
      return v !== f.value;
    case "gt":
      return v !== null && v !== undefined && compare(v, f.value) > 0;
    case "gte":
      return v !== null && v !== undefined && compare(v, f.value) >= 0;
    case "lt":
      return v !== null && v !== undefined && compare(v, f.value) < 0;
    case "lte":
      return v !== null && v !== undefined && compare(v, f.value) <= 0;
    case "in":
      return f.value.includes(v as Scalar);
    case "is":
      return f.value === null ? v === null || v === undefined : v === f.value;
    case "not_null":
      return v !== null && v !== undefined;
    case "prefix":
      return typeof v === "string" && v.startsWith(f.value);
  }
}

export function fixtureReader(role: Role | null): Reader {
  return {
    async list<T extends TableName>(query: ListQuery<T>) {
      const source = fixtures[query.table] as unknown as AnyRow[];
      let rows = source.filter((row) => visible(query.table, row, role));

      for (const f of query.filters ?? []) rows = rows.filter((row) => matches(row, f));

      const term = query.search ? cleanSearchTerm(query.search.term).toLowerCase() : "";
      if (term && query.search) {
        const cols = query.search.columns;
        rows = rows.filter((row) => cols.some((c) => String(row[c] ?? "").toLowerCase().includes(term)));
      }

      const order = query.order ?? [];
      if (order.length) {
        rows = [...rows].sort((a, b) => {
          for (const o of order) {
            const av = a[o.col];
            const bv = b[o.col];
            // Nulls last in both directions, like nullsFirst: false.
            if (av === null || av === undefined) return bv === null || bv === undefined ? 0 : 1;
            if (bv === null || bv === undefined) return -1;
            const c = compare(av, bv);
            if (c !== 0) return o.ascending === false ? -c : c;
          }
          return 0;
        });
      }

      const count = rows.length;
      if (query.limit !== undefined) {
        const from = query.offset ?? 0;
        rows = rows.slice(from, from + query.limit);
      }
      // Structured clone so callers can never mutate the shared fixtures.
      return { rows: structuredClone(rows) as unknown as Tables[T][], count };
    },

    async first<T extends TableName>(table: T, filters: Filter[]) {
      const { rows } = await this.list({ table, filters, limit: 1 });
      return rows[0] ?? null;
    },
  };
}
