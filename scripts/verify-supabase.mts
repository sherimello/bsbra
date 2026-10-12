/**
 * Checks a live Supabase project after supabase/setup.sql has been run, using
 * only the public (publishable) key — exactly what a visitor's browser has.
 *
 *   npm run db:verify
 */
import { existsSync } from "node:fs";

for (const file of [".env.local", ".env"]) {
  if (existsSync(file)) process.loadEnvFile(file);
}

const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, "");
const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
if (!url || !key) {
  console.error("Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY in .env.local first.");
  process.exit(1);
}

const headers = { apikey: key, Authorization: `Bearer ${key}`, "Content-Type": "application/json" };
let failures = 0;

function report(ok: boolean, name: string, detail = "") {
  if (!ok) failures++;
  console.log(`${ok ? "✓" : "✗"} ${name}${detail ? ` — ${detail}` : ""}`);
}

async function rest(path: string, init: RequestInit = {}) {
  const res = await fetch(`${url}/rest/v1/${path}`, { ...init, headers: { ...headers, ...(init.headers ?? {}) } });
  const text = await res.text();
  let body: unknown = text;
  try {
    body = JSON.parse(text);
  } catch {
    // non-JSON body
  }
  return { status: res.status, body, range: res.headers.get("content-range") };
}

async function count(table: string) {
  const r = await rest(`${table}?select=id`, { method: "HEAD", headers: { Prefer: "count=exact" } });
  return r.status < 300 ? Number(r.range?.split("/")[1] ?? 0) : -1;
}

console.log(`Checking ${url}\n`);

// Schema
const settings = await rest("site_settings?select=id,org_name_en");
report(Array.isArray(settings.body) && settings.body.length === 1, "Schema installed (site_settings row present)",
  Array.isArray(settings.body) ? "" : JSON.stringify(settings.body).slice(0, 160));

for (const [table, min] of [["pages", 19], ["compliance_items", 21], ["links", 17]] as const) {
  const n = await count(table);
  report(n >= min, `Starting content: ${table}`, `${n} rows`);
}
for (const table of ["yards", "vessels", "industry_statistics", "posts", "tide_entries"]) {
  const n = await count(table);
  report(n >= 0, `Table readable: ${table}`, n < 0 ? "missing" : n > 0 ? `${n} rows` : "empty — add data in the admin, or load 02_demo_data.sql for a demo");
}

// Views & functions
const view = await rest("vessel_year_summary?select=year,vessels&limit=1");
report(view.status === 200, "Reporting views reachable");
const search = await rest("rpc/global_search", { method: "POST", body: JSON.stringify({ q: "Hong Kong", max_results: 5 }) });
report(search.status === 200 && Array.isArray(search.body), "Global search RPC", Array.isArray(search.body) ? `${search.body.length} hits` : JSON.stringify(search.body).slice(0, 160));

// Row Level Security (anonymous visitor)
for (const table of ["audit_log", "profiles", "members", "meeting_minutes", "contact_messages"]) {
  const r = await rest(`${table}?select=id&limit=1`);
  report(r.status === 200 && Array.isArray(r.body) && r.body.length === 0, `RLS hides ${table} from visitors`);
}
const drafts = await rest("posts?select=id&status=neq.published&limit=1");
report(Array.isArray(drafts.body) && drafts.body.length === 0, "RLS hides unpublished posts");
const write = await rest("posts", { method: "POST", body: JSON.stringify({ slug: "rls-probe", type: "news", title_en: "RLS probe", status: "draft" }) });
report(write.status === 401 || write.status === 403, "RLS blocks anonymous writes", `HTTP ${write.status}`);

// Storage buckets. The public endpoint answers "object not found" for a missing
// file in a public bucket and "bucket not found" for a private (or missing) one,
// so visitors can confirm media is public and documents/minutes are not. Whether
// the private buckets exist can only be seen with the server-side secret key.
const secret = process.env.SUPABASE_SECRET_KEY;
for (const bucket of ["media", "documents", "minutes"]) {
  const isPublic = bucket === "media";
  const res = await fetch(`${url}/storage/v1/object/public/${bucket}/__probe__.txt`, { headers: { apikey: key } });
  const hidden = /bucket not found/i.test(await res.text());
  if (isPublic) {
    report(!hidden, `Storage bucket: ${bucket}`, hidden ? "missing or not public" : "present, public");
    continue;
  }
  if (!hidden) {
    report(false, `Storage bucket: ${bucket}`, "publicly readable — it must be private");
  } else if (secret) {
    const r = await fetch(`${url}/storage/v1/bucket/${bucket}`, { headers: { apikey: secret, Authorization: `Bearer ${secret}` } });
    report(r.ok, `Storage bucket: ${bucket}`, r.ok ? "present, private" : "missing");
  } else {
    report(true, `Storage bucket: ${bucket}`, "private (add SUPABASE_SECRET_KEY to confirm it exists)");
  }
}

// Auth
const auth = (await (await fetch(`${url}/auth/v1/settings`, { headers: { apikey: key } })).json()) as {
  external?: { email?: boolean };
  disable_signup?: boolean;
  mailer_autoconfirm?: boolean;
};
report(auth.external?.email === true, "Auth: e-mail sign-in enabled");
report(auth.mailer_autoconfirm === false, "Auth: e-mail confirmation required");
console.log(`  Sign-ups ${auth.disable_signup ? "disabled (invite-only)" : "enabled (access requests allowed)"}`);

console.log(failures ? `\n${failures} check(s) failed.` : "\nAll checks passed.");
console.log("Remember: Authentication → URL Configuration must list <site>/auth/callback (see README §2.4).");
process.exit(failures ? 1 : 0);
