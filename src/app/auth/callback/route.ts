import { NextResponse, type NextRequest } from "next/server";
import type { EmailOtpType } from "@supabase/supabase-js";
import { isSupabaseConfigured } from "@/lib/env";
import { createServerSupabase } from "@/lib/supabase/server";

/**
 * Completes e-mail links from Supabase Auth (sign-up confirmation, password
 * recovery, invitations). Supports both the PKCE `code` flow and the
 * `token_hash` flow used by custom e-mail templates.
 */
export async function GET(request: NextRequest) {
  const url = request.nextUrl;
  const rawNext = url.searchParams.get("next") ?? "/en/portal";
  const next = rawNext.startsWith("/") && !rawNext.startsWith("//") ? rawNext : "/en/portal";
  const fail = new URL("/en/login?error=link", url.origin);

  if (!isSupabaseConfigured) return NextResponse.redirect(fail);

  const supabase = await createServerSupabase();
  const code = url.searchParams.get("code");
  const tokenHash = url.searchParams.get("token_hash");
  const type = url.searchParams.get("type") as EmailOtpType | null;

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) return NextResponse.redirect(new URL(next, url.origin));
  } else if (tokenHash && type) {
    const { error } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type });
    if (!error) return NextResponse.redirect(new URL(next, url.origin));
  }
  return NextResponse.redirect(fail);
}
