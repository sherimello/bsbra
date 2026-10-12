import "server-only";
import { cache } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { isPreviewMode } from "@/lib/env";
import { createServerSupabase } from "@/lib/supabase/server";
import { fixtures } from "@/lib/demo";
import { ROLES, isStaff } from "./permissions";
import type { Locale } from "@/lib/i18n/config";
import type { Role } from "@/lib/types";

/** Preview builds simulate sign-in with this cookie; ignored once Supabase is configured. */
export const PREVIEW_ROLE_COOKIE = "bsbra_preview_role";

export interface Viewer {
  id: string;
  email: string;
  fullName: string | null;
  organization: string | null;
  designation: string | null;
  phone: string | null;
  role: Role;
  isActive: boolean;
  memberId: string | null;
  isPreview: boolean;
}

/**
 * The signed-in user and their role, read once per request.
 * Deactivated accounts are treated as guests everywhere.
 */
export const getViewer = cache(async (): Promise<Viewer | null> => {
  const cookieStore = await cookies();

  if (isPreviewMode) {
    const role = cookieStore.get(PREVIEW_ROLE_COOKIE)?.value as Role | undefined;
    if (!role || !ROLES.includes(role)) return null;
    const profile = fixtures.profiles.find((p) => p.role === role);
    if (!profile) return null;
    return {
      id: profile.id,
      email: profile.email,
      fullName: profile.full_name,
      organization: profile.organization,
      designation: profile.designation,
      phone: profile.phone,
      role,
      isActive: true,
      memberId: profile.member_id,
      isPreview: true,
    };
  }

  const supabase = await createServerSupabase();
  const { data: claimsData } = await supabase.auth.getClaims();
  const claims = claimsData?.claims;
  if (!claims?.sub) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, email, full_name, organization, designation, phone, role, is_active, member_id")
    .eq("id", claims.sub)
    .maybeSingle();

  const active = profile?.is_active ?? true;
  return {
    id: claims.sub,
    email: profile?.email ?? String(claims.email ?? ""),
    fullName: profile?.full_name ?? null,
    organization: profile?.organization ?? null,
    designation: profile?.designation ?? null,
    phone: profile?.phone ?? null,
    role: active ? ((profile?.role as Role | undefined) ?? "guest") : "guest",
    isActive: active,
    memberId: profile?.member_id ?? null,
    isPreview: false,
  };
});

export async function requireViewer(locale: Locale, next: string): Promise<Viewer> {
  const viewer = await getViewer();
  if (!viewer) redirect(`/${locale}/login?next=${encodeURIComponent(next)}`);
  return viewer;
}

/** Admin panel gate: staff only. Others are sent to sign-in or their portal. */
export async function requireStaff(next = "/admin"): Promise<Viewer> {
  const viewer = await getViewer();
  if (!viewer) redirect(`/en/login?next=${encodeURIComponent(next)}`);
  if (!isStaff(viewer.role)) redirect("/en/portal");
  return viewer;
}
