/**
 * Public runtime configuration. NEXT_PUBLIC_* values are inlined at build
 * time, so this module is safe to import from client and server code.
 *
 * When Supabase is not configured the platform runs in **preview mode**:
 * every page renders from the bundled sample content (src/lib/demo) and all
 * writes are disabled. Add the Supabase keys to switch to live data.
 */

export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";

export const SUPABASE_PUBLISHABLE_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

export const isSupabaseConfigured = Boolean(SUPABASE_URL && SUPABASE_PUBLISHABLE_KEY);

export const isPreviewMode = !isSupabaseConfigured;

export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000").replace(/\/$/, "");

export const GA_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID ?? "";

export const GOOGLE_SITE_VERIFICATION = process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION ?? "";

/** Whether visitors may request an account from the sign-in page. */
export const allowAccessRequests = process.env.NEXT_PUBLIC_ALLOW_ACCESS_REQUESTS !== "false";

/** Public URL for a file in the `media` storage bucket. */
export function mediaUrl(path: string | null | undefined): string | null {
  if (!path) return null;
  if (/^https?:\/\//.test(path) || path.startsWith("/")) return path;
  if (!SUPABASE_URL) return null;
  return `${SUPABASE_URL}/storage/v1/object/public/media/${path.split("/").map(encodeURIComponent).join("/")}`;
}
