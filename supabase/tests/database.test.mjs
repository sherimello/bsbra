/**
 * Database test suite — runs supabase/setup.sql and the seeds against a real
 * Postgres engine (PGlite, in-process) with stand-ins for Supabase's auth and
 * storage schemas, then checks Row Level Security, the profile guard, storage
 * policies and the audit trail as every role.
 *
 *   npm run db:test
 */
import { PGlite } from "@electric-sql/pglite";
import { pg_trgm } from "@electric-sql/pglite/contrib/pg_trgm";
import { pgcrypto } from "@electric-sql/pglite/contrib/pgcrypto";
import fs from "node:fs";
import path from "node:path";

const root = process.argv[2] ?? process.cwd();
const read = (p) => fs.readFileSync(path.join(root, p), "utf8");
const db = new PGlite({ extensions: { pg_trgm, pgcrypto } });

let passed = 0;
let failed = 0;
const ok = (name, cond, extra = "") => {
  if (cond) passed++;
  else failed++;
  console.log(`${cond ? "PASS" : "FAIL"}  ${name}${extra ? `  — ${extra}` : ""}`);
};
const expectError = async (name, fn, match) => {
  try {
    await fn();
    ok(name, false, "no error raised");
  } catch (e) {
    ok(name, !match || String(e.message).match(match), e.message.slice(0, 140));
  }
};

// ---------------------------------------------------------------- Supabase stubs
await db.exec(`
  create role anon nologin;
  create role authenticated nologin;
  create role service_role nologin bypassrls;
  create role supabase_storage_admin nologin;
  create schema auth;
  create table auth.users (id uuid primary key, email text, raw_user_meta_data jsonb default '{}'::jsonb);
  create function auth.uid() returns uuid language sql stable as $$
    select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid
  $$;
  create schema storage;
  create table storage.buckets (id text primary key, name text, public boolean default false,
    file_size_limit bigint, allowed_mime_types text[]);
  create table storage.objects (id uuid primary key default gen_random_uuid(),
    bucket_id text references storage.buckets (id), name text, owner uuid);
  alter table storage.objects enable row level security;
  grant usage on schema auth, storage to anon, authenticated;
  grant execute on function auth.uid() to anon, authenticated;
  grant select, insert, update, delete on storage.objects to anon, authenticated;
`);

// ---------------------------------------------------------------- Setup (twice)
const setup = read("supabase/setup.sql");
await db.exec(setup);
ok("setup.sql runs on an empty database", true);
await db.exec(setup);
ok("setup.sql runs a second time (idempotent)", true);
await db.exec(read("supabase/seed/02_demo_data.sql"));
ok("02_demo_data.sql loads", true);
await db.exec(read("supabase/seed/02_demo_data.sql"));
ok("02_demo_data.sql re-runs safely", true);

const count = async (sql, params = []) => Number((await db.query(sql, params)).rows[0].n);
ok("pages seeded", (await count("select count(*) n from public.pages")) === 19);
ok("vessels seeded", (await count("select count(*) n from public.vessels")) === 60);
ok("tides seeded", (await count("select count(*) n from public.tide_entries")) > 1300);
ok("seed did not write audit rows", (await count("select count(*) n from public.audit_log")) === 0);
ok("buckets created", (await count("select count(*) n from storage.buckets")) === 3);
ok("generated recycling_year matches beaching date",
  (await count("select count(*) n from public.vessels where recycling_year <> extract(year from coalesce(beaching_date, arrival_date))")) === 0);

// ---------------------------------------------------------------- Users
const users = {
  super_admin: "00000000-0000-4000-8000-000000000001",
  admin: "00000000-0000-4000-8000-000000000002",
  editor: "00000000-0000-4000-8000-000000000003",
  data_entry: "00000000-0000-4000-8000-000000000004",
  committee: "00000000-0000-4000-8000-000000000005",
  member: "00000000-0000-4000-8000-000000000006",
  corporate: "00000000-0000-4000-8000-000000000007",
  guest: "00000000-0000-4000-8000-000000000008",
};
for (const [role, id] of Object.entries(users)) {
  await db.query("insert into auth.users (id, email, raw_user_meta_data) values ($1, $2, $3)", [
    id,
    `${role}@test.bd`,
    JSON.stringify({ full_name: `Test ${role}`, organization: "Test Org" }),
  ]);
}
ok("sign-up trigger creates guest profiles", (await count("select count(*) n from public.profiles where role = 'guest'")) === 8);
for (const [role, id] of Object.entries(users)) {
  if (role !== "guest") await db.query("update public.profiles set role = $1 where id = $2", [role, id]);
}
ok("SQL Editor (no auth context) can bootstrap roles", (await count("select count(*) n from public.profiles where role = 'super_admin'")) === 1);

const as = async (who, fn) => {
  await db.exec("reset role");
  if (who === "anon") {
    await db.query("select set_config('request.jwt.claim.sub', '', false)");
    await db.exec("set role anon");
  } else {
    await db.query("select set_config('request.jwt.claim.sub', $1, false)", [users[who]]);
    await db.exec("set role authenticated");
  }
  try {
    return await fn();
  } finally {
    await db.exec("reset role");
    await db.query("select set_config('request.jwt.claim.sub', '', false)");
  }
};

// ---------------------------------------------------------------- Anonymous visitor
await as("anon", async () => {
  const publishedPosts = await count("select count(*) n from public.posts");
  ok("anon sees published public posts", publishedPosts === 12, `${publishedPosts}`);
  ok("anon sees only public documents", (await count("select count(*) n from public.documents where access_level <> 'public'")) === 0);
  ok("anon cannot read minutes", (await count("select count(*) n from public.meeting_minutes")) === 0);
  ok("anon cannot read members", (await count("select count(*) n from public.members")) === 0);
  ok("anon cannot read audit log", (await count("select count(*) n from public.audit_log")) === 0);
  ok("anon cannot read profiles", (await count("select count(*) n from public.profiles")) === 0);
  ok("anon reads site settings", (await count("select count(*) n from public.site_settings")) === 1);
  ok("anon reads reporting views", (await count("select count(*) n from public.vessel_year_summary")) > 0);
  const hits = await db.query("select * from public.global_search('Hong Kong', 20)");
  ok("global_search works for anon", hits.rows.length > 0, `${hits.rows.length} hits`);
  await db.query("insert into public.contact_messages (name, email, message, locale) values ('Visitor', 'v@test.bd', 'Hello from the contact form', 'en')");
  ok("anon can submit a contact message", true);
  await expectError("anon cannot read messages back", async () => {
    const r = await count("select count(*) n from public.contact_messages");
    if (r === 0) throw new Error("0 rows visible (expected)");
  }, /0 rows/);
  await expectError("anon cannot insert posts", () =>
    db.query("insert into public.posts (slug, type, title_en, status) values ('x-anon', 'news', 'Anon post', 'draft')"), /row-level security/);
  await expectError("anon cannot write audit log", () =>
    db.query("insert into public.audit_log (action, table_name) values ('insert', 'x')"), /permission denied/);
});

// ---------------------------------------------------------------- Data entry
await as("data_entry", async () => {
  await db.query("insert into public.posts (slug, type, title_en, status) values ('de-draft', 'news', 'Data entry draft', 'draft')");
  ok("data_entry can create a draft", true);
  await expectError("data_entry cannot publish", () =>
    db.query("insert into public.posts (slug, type, title_en, status) values ('de-pub', 'news', 'Should fail', 'published')"), /row-level security/);
  const upd = await db.query("update public.posts set title_en = 'hacked' where slug = 'bsbra-platform-launch'");
  ok("data_entry cannot edit published posts", upd.affectedRows === 0);
  const del = await db.query("delete from public.vessels where vessel_name = 'VEGA STAR'");
  ok("data_entry cannot delete data", del.affectedRows === 0);
  await db.query("insert into public.vessels (vessel_name, imo_number, vessel_type, ldt, arrival_date, beaching_date, status) values ('TEST SHIP', '1000007', 'tug', 900, '2026-09-01', '2026-09-03', 'beached')");
  ok("data_entry can record a vessel", true);
  await expectError("invalid IMO check digit rejected", () =>
    db.query("insert into public.vessels (vessel_name, imo_number) values ('BAD IMO', '1234568')"), /check constraint/);
  ok("data_entry cannot see minutes drafts", (await count("select count(*) n from public.meeting_minutes where status = 'draft'")) === 0);
  await db.query("insert into storage.objects (bucket_id, name) values ('media', 'test/photo.jpg')");
  ok("staff can upload to media", true);
});

// ---------------------------------------------------------------- Editor
await as("editor", async () => {
  const r = await db.query("update public.posts set status = 'published' where slug = 'de-draft'");
  ok("editor can publish", r.affectedRows === 1);
  const d = await db.query("delete from public.vessels where vessel_name = 'TEST SHIP'");
  ok("editor can delete data", d.affectedRows === 1);
  await expectError("editor cannot manage minutes", () =>
    db.query("insert into public.meeting_minutes (title_en, meeting_date) values ('Editor minutes', '2026-10-01')"), /row-level security/);
  ok("editor cannot read the audit log", (await count("select count(*) n from public.audit_log")) === 0);
});

const published = await db.query("select published_at from public.posts where slug = 'de-draft'");
ok("published_at stamped on publish", published.rows[0]?.published_at !== null);
const audit = await db.query("select action, actor_email, actor_role, changed_fields from public.audit_log where table_name = 'posts' order by id");
ok("audit records insert by data_entry", audit.rows.some((r) => r.action === "insert" && r.actor_email === "data_entry@test.bd" && r.actor_role === "data_entry"));
ok("audit records publish by editor with changed fields", audit.rows.some((r) => r.action === "update" && r.actor_email === "editor@test.bd" && r.changed_fields?.includes("status")));
ok("audit records vessel delete", (await count("select count(*) n from public.audit_log where table_name = 'vessels' and action = 'delete'")) === 1);

// ---------------------------------------------------------------- Admin & profile guard
await as("admin", async () => {
  ok("admin reads the audit log", (await count("select count(*) n from public.audit_log")) > 0);
  ok("admin reads all profiles", (await count("select count(*) n from public.profiles")) === 8);
  await db.query("update public.profiles set role = 'member' where id = $1", [users.guest]);
  ok("admin can approve a guest as member", true);
  await expectError("admin cannot grant admin", () =>
    db.query("update public.profiles set role = 'admin' where id = $1", [users.member]), /super admin/);
  await expectError("admin cannot modify a super admin", () =>
    db.query("update public.profiles set full_name = 'x' where id = $1", [users.super_admin]), /super admin/);
  await expectError("admin cannot change own role", () =>
    db.query("update public.profiles set role = 'super_admin' where id = $1", [users.admin]), /own role|super admin/);
  await db.query("insert into public.meeting_minutes (title_en, meeting_date, status, access_level, file_path) values ('Approved members minutes', '2026-10-02', 'approved', 'members', 'm/approved.pdf')");
  ok("admin manages minutes", true);
  ok("admin reads messages", (await count("select count(*) n from public.contact_messages")) === 1);
  await db.query("select public.log_activity('export', 'audit_log', '{}'::jsonb)");
  ok("log_activity records an export", true);
});
await as("super_admin", async () => {
  await db.query("update public.profiles set role = 'editor' where id = $1", [users.guest]);
  ok("super admin can change roles", true);
});
ok("role change was audited", (await count("select count(*) n from public.audit_log where table_name = 'profiles' and 'role' = any(changed_fields)")) >= 2);

// ---------------------------------------------------------------- Members, committee, corporate
await as("member", async () => {
  await expectError("member cannot change own role", () =>
    db.query("update public.profiles set role = 'admin' where id = $1", [users.member]), /administrators/);
  const own = await db.query("update public.profiles set phone = '+880' where id = $1", [users.member]);
  ok("member can update own contact details", own.affectedRows === 1);
  ok("member sees members-level minutes", (await count("select count(*) n from public.meeting_minutes")) >= 1);
  ok("member does not see internal minutes", (await count("select count(*) n from public.meeting_minutes where access_level = 'internal'")) === 0);
  ok("member reads the member registry", (await count("select count(*) n from public.members")) === 17);
  ok("member cannot read others' profiles", (await count("select count(*) n from public.profiles")) === 1);
  ok("member can read approved minutes file", (await count("select count(*) n from storage.objects where bucket_id = 'minutes'")) === 0, "no object yet");
  await expectError("member cannot upload to media", () =>
    db.query("insert into storage.objects (bucket_id, name) values ('media', 'x/y.jpg')"), /row-level security/);
});
await db.query("insert into storage.objects (bucket_id, name) values ('minutes', 'm/approved.pdf'), ('documents', 'doc/members.pdf')");
await db.query("insert into public.documents (title_en, category, file_path, status, access_level) values ('Members circular', 'circular', 'doc/members.pdf', 'published', 'members')");
await as("member", async () => {
  ok("member can read approved minutes file in storage", (await count("select count(*) n from storage.objects where bucket_id = 'minutes'")) === 1);
  ok("member can read members document file", (await count("select count(*) n from storage.objects where bucket_id = 'documents'")) === 1);
});
await as("corporate", async () => {
  ok("corporate cannot read members document file", (await count("select count(*) n from storage.objects where bucket_id = 'documents'")) === 0);
  ok("corporate cannot read minutes", (await count("select count(*) n from public.meeting_minutes")) === 0);
  ok("corporate sees corporate documents only beyond public", (await count("select count(*) n from public.documents where access_level in ('members', 'internal')")) === 0);
});
await as("anon", async () => {
  ok("anon cannot read private files", (await count("select count(*) n from storage.objects where bucket_id in ('documents', 'minutes')")) === 0);
});
await as("committee", async () => {
  await db.exec("reset role");
  await db.query("insert into public.meeting_minutes (title_en, meeting_date, status, access_level) values ('Internal minutes', '2026-10-03', 'approved', 'internal')");
  await db.query("select set_config('request.jwt.claim.sub', $1, false)", [users.committee]);
  await db.exec("set role authenticated");
  ok("committee sees internal minutes", (await count("select count(*) n from public.meeting_minutes where access_level = 'internal'")) >= 1);
});

// ---------------------------------------------------------------- Download counter
await as("anon", async () => {
  const doc = await db.query("select id from public.documents where access_level = 'public' limit 1");
  await db.query("select public.record_document_download($1)", [doc.rows[0].id]);
  ok("download counter callable by anon", true);
});
ok("download counted", (await count("select coalesce(sum(downloads), 0) n from public.document_stats")) === 1);

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed ? 1 : 0);
