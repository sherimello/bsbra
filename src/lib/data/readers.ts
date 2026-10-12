import "server-only";
import { isPreviewMode } from "@/lib/env";
import { getPublicSupabase } from "@/lib/supabase/public";
import { createServerSupabase } from "@/lib/supabase/server";
import { getViewer } from "@/lib/auth/session";
import { fixtureReader, supabaseReader, type Reader } from "./backend";

/** Anonymous reader — safe inside `"use cache"` (no cookies, public RLS view). */
export function publicReader(): Reader {
  return isPreviewMode ? fixtureReader(null) : supabaseReader(getPublicSupabase());
}

/** Reader bound to the signed-in user's session and role. Request-time only. */
export async function viewerReader(): Promise<Reader> {
  if (isPreviewMode) {
    const viewer = await getViewer();
    return fixtureReader(viewer?.role ?? null);
  }
  return supabaseReader(await createServerSupabase());
}
