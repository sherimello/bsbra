# BSBRA Digital Platform

The official website and data platform for the **Bangladesh Ship Breakers & Recyclers Association** — a bilingual (English / বাংলা) public site, a members' and corporate portal, and a complete admin CMS with role-based access control and an immutable audit trail.

- **Frontend:** Next.js 16 (App Router, Cache Components, Partial Prerendering), React 19, TypeScript, Tailwind CSS 4, Motion
- **Backend:** Supabase — Postgres with Row Level Security, Auth, Storage
- **Design:** quiet, editorial and minimal — Google Sans Flex (variable weight and optical size) with size-specific tracking, white by default with an optional dark appearance, ink-on-white actions with a single blue for links, fine-line bathymetric artwork, critically-damped springs, reduced-motion and reduced-transparency support

---

## Contents

1. [Quick start (preview mode)](#1-quick-start-preview-mode)
2. [Connect Supabase](#2-connect-supabase)
3. [Roles & permissions](#3-roles--permissions)
4. [Managing content](#4-managing-content)
5. [Deployment](#5-deployment)
6. [Architecture](#6-architecture)
7. [Requirements coverage](#7-requirements-coverage)
8. [Before launch checklist](#8-before-launch-checklist)
9. [Extending the platform](#9-extending-the-platform)

---

## 1. Quick start (preview mode)

Requires Node.js 20.9+.

```bash
npm install
npm run dev
```

Open http://localhost:3000. Without Supabase keys the platform runs in **preview mode**:

- Every page renders from the bundled sample content in `src/lib/demo`.
- Sign-in is simulated: the sign-in page offers one button per role so you can explore the public site, the members/corporate portal and the admin panel as each role.
- All writes are disabled (forms validate, then explain that Supabase isn't connected).
- A "Preview build · sample content" badge appears in the footer and `robots.txt` blocks indexing.

> **Content.** The starting content is drawn from public sources (checked October 2026) and cited on the site's Credits page:
> - the 17 yards on the IMO list (The Business Standard, 18 May 2026);
> - ships recycled per year, 2018–2025 (NGO Shipbreaking Platform, via The Daily Star and The Financial Express);
> - the 2026–2028 Executive Committee (The Daily Star and Times of Bangladesh);
> - real news and press coverage;
> - laws and conventions;
> - CC-licensed photographs from Wikimedia Commons.
>
> Only the **vessels**, **members-only documents and minutes**, and the **monthly tide tables** in preview mode are illustrative. Vessel names are fictional, IMO-format numbers use the unused `1xxxxxx` range, vessels aren't linked to any yard, and the tide tables are synthesised. These live only in `02_demo_data.sql`, never in the starting content. The live tide *forecast* is real (see §6).

---

## 2. Connect Supabase

The project is wired to Supabase project **`jbondogatgxkwqgtzell`** (keys in `.env.local`).

> **Status (12 Oct 2026):** the schema (all six migrations) and the starting content are installed on `jbondogatgxkwqgtzell`, and `npm run db:verify` passes. What remains on that project is the Auth configuration in §2.2, the secret key in §2.3 and the first Controlling Authority in §2.4. For any *new* project, follow every step below.

### 2.1 Run the database setup — one file
**Supabase Dashboard → SQL Editor → New query →** paste the whole of [`supabase/setup.sql`](supabase/setup.sql) **→ Run**.

It contains all six migrations plus the starting content, and every statement is idempotent — running it again (e.g. after an update) is safe. Regenerate it after editing migrations with `npm run db:setup-sql`.

| Migration | Creates |
|---|---|
| `…000100_foundation.sql` | Extensions, enums (roles, access levels, statuses), helper and trigger functions, IMO check-digit validation |
| `…000200_tables.sql` | All tables, constraints, indexes, row-metadata triggers |
| `…000300_security.sql` | API grants, role helpers (in a `private` schema the Data API doesn't expose), sign-up trigger, profile guard, **Row Level Security policies** |
| `…000400_audit.sql` | Append-only audit log with triggers on every managed table, activity logging, download counters |
| `…000500_storage.sql` | `media` (public), `documents` and `minutes` (private) buckets and their policies |
| `…000600_search_reports.sql` | Global bilingual search function and reporting views |

**Optional — demo data for staging:** run [`supabase/seed/02_demo_data.sql`](supabase/seed/02_demo_data.sql) the same way. It adds sample vessels, synthesised tide tables, a member registry and sample minutes. Do not run it in production.

Prefer the CLI? `npx supabase link --project-ref jbondogatgxkwqgtzell`, then `npx supabase db push` (migrations) and `npx supabase config push` (auth settings and e-mail templates from [`supabase/config.toml`](supabase/config.toml)).

### 2.2 Configure Auth (Dashboard → Authentication)
1. **URL Configuration**
   - **Site URL:** the production URL, e.g. `https://www.bsbra.org.bd`
   - **Redirect URLs:** `https://<your-domain>/auth/callback` and `http://localhost:3000/auth/callback`
2. **Email Templates** — replace each template's body with the matching file from [`supabase/templates`](supabase/templates) (bilingual, branded). They use `token_hash` links handled by `/auth/callback`, so confirmation works even when the e-mail is opened on a different device:

   | Template | File | Suggested subject |
   |---|---|---|
   | Confirm signup | `confirm-signup.html` | Confirm your email · BSBRA |
   | Reset password | `reset-password.html` | Reset your password · BSBRA |
   | Invite user | `invite.html` | You're invited to BSBRA |
   | Change email address | `email-change.html` | Confirm your new email · BSBRA |
3. **SMTP Settings** — set up custom SMTP (e.g. the association's mail server, Amazon SES, Resend) so mail comes from BSBRA's domain. Supabase's built-in sender is rate-limited and meant for testing only.
4. **Providers → Email** — keep *Confirm email* on. Set *Minimum password length* to 8.

### 2.3 Environment variables
`.env.local` (development) and your host's settings (production):

```bash
NEXT_PUBLIC_SITE_URL=https://www.bsbra.org.bd          # http://localhost:3000 locally
NEXT_PUBLIC_SUPABASE_URL=https://jbondogatgxkwqgtzell.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_…
SUPABASE_SECRET_KEY=sb_secret_…        # server only — needed for user invitations
```

### 2.4 Verify and create the first Controlling Authority
1. `npm run db:verify` — checks the live project with the public key: schema, content, search, Row Level Security, storage buckets and auth settings. With `SUPABASE_SECRET_KEY` set it also confirms the private buckets exist (visitors can't see them, by design).
2. Start the app, open **/en/request-access** and register (or create the user under **Authentication → Users**), then confirm the e-mail.
3. In the SQL Editor:
   ```sql
   update public.profiles set role = 'super_admin' where email = 'you@example.org';
   ```
4. Sign in at **/en/login** — you'll land in the admin panel. Invite everyone else from **Admin → Users & roles**.

### 2.5 Testing the database locally
`npm run db:test` runs `setup.sql` and the seeds against a real Postgres engine in-process (PGlite) with stand-ins for Supabase's auth and storage schemas, then checks Row Level Security, the profile guard, storage policies and the audit trail as every role (69 checks).

## 3. Roles & permissions

Enforced in the database by Row Level Security (the UI mirrors it in `src/lib/auth/permissions.ts`).

| Role | Public site | Portal | Admin |
|---|---|---|---|
| **Controlling Authority** (`super_admin`) | ✓ | everything | Full control incl. administrators, settings, audit log |
| **Administrator** (`admin`) | ✓ | everything | All content & data, minutes, users (not administrators), settings, audit log |
| **Editor** (`editor`) | ✓ | everything | Create, edit, **publish** and delete content and industry data |
| **Data entry** (`data_entry`) | ✓ | everything | Create and update drafts and data — cannot publish or delete |
| **Executive Committee** (`committee`) | ✓ | internal documents & minutes | — |
| **Member** (`member`) | ✓ | member documents, approved minutes, directory, datasets | — |
| **Corporate** (`corporate`) | ✓ | corporate documents, datasets | — |
| **Guest** (`guest`) | ✓ | "access pending" | — |

**Access levels** on pages, posts, documents and minutes: `public` → everyone; `corporate` → corporate users and above; `members` → members, committee and staff; `internal` → committee and staff. Private files in Storage are only served through short-lived signed URLs, and only when the visitor may see the matching record.

**Audit trail:** every insert, update and delete on a managed table is written by a database trigger with the user, role, time, changed fields and before/after values. Sign-ins, exports, imports, downloads and invitations are logged too. Nobody — not even administrators — can edit or delete entries through the API. View and export them in **Admin → Audit log**.

---

## 4. Managing content

Everything is managed at **/admin**. The panel is generated from `src/lib/admin/resources.ts`.

| Section | Notes |
|---|---|
| **News & posts** | One feed for news, announcements, events, meetings, seminars, workshops, press releases, statements, interviews, TV reports, media coverage, international and CSR items. Featured posts appear on the homepage. |
| **Pages** | Long-form pages. In the body, start a new section with `## Heading` — each becomes an animated, numbered section on the site. About sections use slugs beginning `about-`. |
| **Documents** | Upload PDFs/Office files (≤ 50 MB) or link externally. Choose a category, year and who can see it. |
| **Executive Committee / Past presidents** | Photos, designations, bilingual profiles, optional public contact details. |
| **Compliance** | Laws, conventions, facilities, initiatives; the "Our compliance" category powers *Our Compliances*. |
| **Gallery albums** | Open an album and use **Upload photos** to add many images at once. |
| **Yards** | Status (green/progressive/…), certification, facility lists (one per line, per language), map coordinates, photographs. |
| **Vessels** | IMO numbers are validated (check digit). Recycling year is derived from the beaching/arrival date. |
| **Industry / Labour statistics** | One record per year; charts and tables update automatically. |
| **Tide entries / Import tides** | Import a year from CSV: `station,date,time,type,height_m` (time in BST, type `high`/`low`). |
| **Minutes** | Administrators only. Only **approved** minutes reach the portal, at the chosen access level. |
| **Messages** | Contact-form enquiries; mark as read/replied/archived. |
| **Site settings** | Contacts, office hours, map location, media desk, social links, the **BSRB link**, homepage announcement. |

Editing is bilingual side by side; Bangla falls back to English when left empty. Changes appear on the public site immediately (cache tags are refreshed on save). ⌘S / Ctrl+S saves any form.

---

## 5. Deployment

**Recommended: Vercel** (zero-config for Next.js, automatic HTTPS, global CDN).

1. Push the repository to GitHub and import it in Vercel.
2. Add the environment variables from `.env.example` (Production and Preview).
3. Add the domain (e.g. `bsbra.org.bd`) and point DNS as Vercel instructs — SSL certificates are issued automatically.
4. Update Supabase **Site URL** and **Redirect URLs** to the production domain.

Self-hosting also works: `npm run build && npm run start` behind a reverse proxy (Node 20.9+), or in Docker (add `output: "standalone"` to `next.config.ts` for a slim image).

**Backups:** Supabase takes daily backups (Pro plan: 7 days, with Point-in-Time Recovery available as an add-on). Storage files can be mirrored with `supabase storage` CLI or rclone.

**Analytics:** set `NEXT_PUBLIC_GA_MEASUREMENT_ID` for Google Analytics 4 (IP-anonymised), or enable Vercel Analytics.

**Security headers** (HSTS, nosniff, frame-options, referrer and permissions policy) are configured in `next.config.ts`.

---

## 6. Architecture

```
src/
  app/
    [locale]/            Public site (en, bn) + portal + auth pages — one root layout
    admin/               Admin CMS — its own root layout
    api/                 Document/minutes downloads (signed URLs), CSV reports
    auth/callback/       Supabase e-mail link handler
  components/
    ui/ motion/ site/ charts/ admin/ portal/ auth/ home/
  lib/
    data/                Data layer: one query API over Supabase or preview fixtures
    admin/               Resource config, validation, server actions, queries
    auth/                Session, permissions, auth server actions
    i18n/                Dictionaries (en, bn), formatting (Bangla numerals & dates)
    supabase/            Clients: public (cache-safe), server (cookies), browser, service
    demo/                Sample content (also the source of the SQL seeds)
  proxy.ts               Locale routing, session refresh, private-area gate
supabase/
  migrations/            Schema, RLS, audit, storage, search
  seed/                  Generated content and demo seeds
scripts/                 Seed, artwork and setup-SQL generators; live verification
src/assets/fonts/        Google Sans Flex (source TTF + the Latin woff2 subset the site loads)
public/art/              Generated bathymetric artwork (placeholders until photos are uploaded)
```

**Live coast data.** `src/lib/data/coast.ts` calls Open-Meteo's marine and weather APIs for the Sitakunda coast. It needs no key, and the data is CC BY 4.0.
- Results are cached for 15 minutes and shared by all visitors.
- High and low tides are found from the hourly sea-level curve, refined to the minute with a parabola fit.
- Where it appears:
  - the live strip under the home hero;
  - the tide forecast (curve plus 7-day table) on `/tides`.
- If the service is down, the panels are hidden.
- It is a model relative to mean sea level, so the official monthly tables (Admin → Import tides) remain the reference for beaching.

**Scroll reveal.** Every outermost content block in `<main>` and the footer enters the same way: from blurred, 96.5% size and transparent to sharp, full size and opaque.
- A pure-CSS entrance covers the first paint. It needs no JavaScript and never flashes.
- `RevealController` replays the entrance each time a block scrolls back into view, staggered when several arrive together. It resets blocks only while they are off-screen.
- It uses the Web Animations API, so React's markup is never changed.
- Keep the selector in `globals.css` in step with `REVEAL_SELECTOR`.
- Mark a region `data-no-reveal` to opt it out.
- Reduced-motion users get no animation.

**Design system.** Tokens live in `src/app/globals.css`: light by default, with `html[data-theme="dark"]` as an opt-in appearance chosen from the header (remembered per browser; an inline script applies it before first paint, so there is no flash). "Brand" is the action colour — ink on light, paper on dark — and links use one blue. Google Sans Flex is loaded through `next/font/local` from a Latin subset that keeps the weight and optical-size axes variable; Bangla falls through to Noto Sans Bengali. To rebuild the subset after replacing the TTF, instance it at `GRAD=0 ROND=0 slnt=0 wdth=100` and subset to Latin with fontTools (`pip install fonttools brotli`).

**Rendering.** Public data functions use `"use cache"` with a cache tag per table and run as an anonymous visitor (RLS applies), so pages are prerendered into a static shell and served instantly from the CDN; admin saves call `updateTag()` to refresh exactly what changed. Search, filters and anything user-specific stream in behind `<Suspense>`. The portal and admin render per request.

**Preview vs. live.** `src/lib/data/backend.ts` runs the same query description against PostgREST or the in-memory fixtures, emulating the RLS rules in preview so every page behaves identically in both modes.

**Scripts**

| Command | Purpose |
|---|---|
| `npm run dev` | Development server |
| `npm run build` / `npm start` | Production build / server |
| `npm run lint` / `npm run typecheck` | ESLint / TypeScript |
| `npm run seed:generate` | Regenerate `supabase/seed/*.sql` from `src/lib/demo` |
| `npm run art` | Regenerate the contour artwork (placeholders for yards and posts without photos) |
| `npm run db:setup-sql` | Rebuild `supabase/setup.sql` from the migrations and starting content |
| `npm run db:test` | Database test suite (setup, seeds, RLS, storage, audit) on in-process Postgres |
| `npm run db:verify` | Check the live Supabase project with the public key |
| `npm run db:types` | Generate Supabase types (after `supabase link`) |

---

## 7. Requirements coverage

| # | Requirement | Where |
|---|---|---|
| 1 | Identity, responsive, secure, scalable | Logo/mark (`components/site/logo.tsx`), design system (`app/globals.css`), security headers, RLS |
| 2 | Public / Members / Corporate views, RBAC | Access levels + roles (migration 03), portal (`/portal`) |
| 3 | About BSBRA (history … future prospects) | `/about` — `about-*` CMS pages |
| 4 | Executive Committee & past presidents | `/leadership`; Admin → Executive Committee, Past presidents |
| 5 | Industry statistics with charts & tables | `/industry` (charts, KPIs, table, CSV) |
| 6 | Yard-wise vessel database | `/vessels`, `/vessels/[id]`, CSV export; Admin → Vessels |
| 7 | Green & progressive yards | `/yards`, `/yards/[slug]` (facilities, certification, map, photos) |
| 8 | Green recycling & compliance + Our Compliances | `/compliance`, `/compliance/our-compliances` |
| 9 | Waste management | `/waste-management` |
| 10 | Site safety & occupational health | `/safety` |
| 11 | Tide & beaching (calendar/table, annual updates) | `/tides` (calendar, table, beaching window, CSV); Admin → Import tides |
| 12 | Labour-related information | `/labour` (KPIs, chart, table, CMS sections) |
| 13 | CSR | `/csr` (filter by area) |
| 14 | News feed & announcements (auto on homepage) | `/news`, homepage newsroom, upcoming events |
| 15 | Press & media | `/press` (releases, coverage, media contact) |
| 16 | International initiatives | `/international` |
| 17 | Publications & downloads (category/year filters) | `/publications`, portal documents |
| 18 | Photo gallery (categories, high-res download) | `/gallery`, `/gallery/[slug]` (viewer with swipe & download) |
| 19 | Board / EC minutes (secure, searchable) | Admin → Minutes; portal → Minutes; private bucket |
| 20 | Regulatory links incl. prominent BSRB | `/links`, homepage BSRB band, footer |
| 21–22 | Data entry; add/edit/update/delete/upload | Admin CMS (generated forms, direct-to-storage uploads) |
| 23 | Controlling authority / user management | Admin → Users & roles (invite, roles, deactivate) |
| 24 | Audit report / activity log | Database triggers; Admin → Audit log (filters, diff, CSV) |
| 25 | Admin panel / CMS | `/admin` |
| 26 | Search & reporting | Global search (`/search`, ⌘K), filters everywhere, CSV reports |
| 27 | Bilingual English / বাংলা | `/en`, `/bn`, one-tap switch, bilingual fields throughout |
| 28 | SSL, backups, auth, RBAC, speed, SEO, maps, social, analytics | See §5; sitemap, robots, hreflang, OG images, JSON-LD, Google Maps embeds |
| 29 | Future modules | See §9 |

---

## 8. Before launch checklist

- [ ] Do not run `02_demo_data.sql` in production. Enter vessel records and the official monthly tide tables (Admin → Import tides).
- [ ] Review the starting content against BSBRA's own records:
  - yard details, logos and coordinates;
  - official statistics (tonnage, active yards, workers);
  - committee spellings and portraits;
  - the office address (taken from the Bangladesh Employers' Federation listing).
- [ ] Replace the Wikimedia Commons photographs with BSBRA's own over time (`src/lib/media/photos.ts`, Admin → uploads), keeping the Credits page in step.
- [ ] Open-Meteo's free API is for non-commercial use. If BSBRA's use counts as commercial, take an Open-Meteo API plan.
- [ ] **Site settings:** address, phone, e-mail, office hours, map location, media contact, social links.
- [ ] **BSRB link:** set the Bangladesh Ship Recycling Board's official website (preview uses the Ministry of Industries site).
- [ ] Review and approve all page copy (About, compliance, waste, safety, labour, privacy, terms) in both languages.
- [ ] Add committee photographs and profiles; add past presidents.
- [ ] Upload real documents, annual reports and minutes.
- [ ] Run `supabase/setup.sql`, then `npm run db:verify` until every check passes.
- [ ] Configure custom SMTP and paste the e-mail templates from `supabase/templates` (README §2.2).
- [ ] Set `NEXT_PUBLIC_SITE_URL`, add the domain, verify Search Console (`NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION`).
- [ ] Decide whether public access requests stay enabled (`NEXT_PUBLIC_ALLOW_ACCESS_REQUESTS`).
- [ ] Train staff on the admin panel (roles, publishing workflow, imports).

---

## 9. Extending the platform

The structure anticipates the future modules in the brief (online membership applications, member portal features, online forms, interactive maps, event registration, newsletter):

1. Add a migration with the new table, its RLS policies (copy a pattern from migration 03) and an audit trigger (`create trigger <t>_audit …`).
2. Add the row type to `src/lib/types.ts`.
3. Add a `ResourceConfig` to `src/lib/admin/resources.ts` — the admin list, form, validation and permissions are generated.
4. Add a cached query in `src/lib/data/public.ts` (tagged with the table name) and a page under `src/app/[locale]/`.
5. Add strings to both dictionaries in `src/lib/i18n/dictionaries/`.
# bsbra
