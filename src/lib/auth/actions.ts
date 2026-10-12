"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import { SITE_URL, allowAccessRequests, isPreviewMode } from "@/lib/env";
import { createServerSupabase } from "@/lib/supabase/server";
import { isLocale, type Locale } from "@/lib/i18n/config";
import { ROLES, homeForRole } from "./permissions";
import { PREVIEW_ROLE_COOKIE } from "./session";
import type { Role } from "@/lib/types";

export interface AuthState {
  status: "idle" | "success" | "error";
  code?: "invalid" | "inactive" | "weak" | "generic" | "disabled";
}

function localeOf(formData: FormData): Locale {
  const value = String(formData.get("locale") ?? "en");
  return isLocale(value) ? value : "en";
}

/** Only same-site relative paths are accepted as post-login destinations. */
function safeNext(value: FormDataEntryValue | null): string | null {
  const next = typeof value === "string" ? value : "";
  return next.startsWith("/") && !next.startsWith("//") && !next.includes("\\") ? next : null;
}

const password = z
  .string()
  .min(8)
  .max(72)
  .regex(/[A-Za-z]/)
  .regex(/[0-9]/);

export async function signIn(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const locale = localeOf(formData);
  const parsed = z.object({ email: z.email(), password: z.string().min(1).max(200) }).safeParse({
    email: String(formData.get("email") ?? "").trim(),
    password: formData.get("password"),
  });
  if (!parsed.success) return { status: "error", code: "invalid" };
  if (isPreviewMode) return { status: "error", code: "disabled" };

  const supabase = await createServerSupabase();
  const { data, error } = await supabase.auth.signInWithPassword(parsed.data);
  if (error || !data.user) return { status: "error", code: "invalid" };

  const { data: profile } = await supabase.from("profiles").select("role, is_active").eq("id", data.user.id).maybeSingle();
  if (profile && !profile.is_active) {
    await supabase.auth.signOut();
    return { status: "error", code: "inactive" };
  }
  await supabase.rpc("log_activity", { p_action: "sign_in" });

  const role = (profile?.role as Role | undefined) ?? "guest";
  const next = safeNext(formData.get("next"));
  redirect(next ?? (homeForRole(role) === "admin" ? "/admin" : `/${locale}/portal`));
}

/** Preview builds only: simulate a session for the chosen role. */
export async function previewSignIn(formData: FormData) {
  const locale = localeOf(formData);
  const role = String(formData.get("role") ?? "") as Role;
  if (!isPreviewMode || !ROLES.includes(role)) redirect(`/${locale}/login`);
  (await cookies()).set(PREVIEW_ROLE_COOKIE, role, {
    path: "/",
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 8,
  });
  const next = safeNext(formData.get("next"));
  redirect(next ?? (homeForRole(role) === "admin" ? "/admin" : `/${locale}/portal`));
}

export async function signOut(formData: FormData) {
  const locale = localeOf(formData);
  if (isPreviewMode) {
    (await cookies()).delete(PREVIEW_ROLE_COOKIE);
  } else {
    const supabase = await createServerSupabase();
    await supabase.rpc("log_activity", { p_action: "sign_out" });
    await supabase.auth.signOut();
  }
  redirect(`/${locale}`);
}

export async function requestAccess(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const locale = localeOf(formData);
  if (!allowAccessRequests || isPreviewMode) return { status: "error", code: "disabled" };

  const parsed = z
    .object({
      full_name: z.string().trim().min(2).max(120),
      organization: z.string().trim().min(2).max(200),
      designation: z.string().trim().max(120).optional(),
      phone: z.string().trim().max(40).optional(),
      email: z.email().max(254),
    })
    .safeParse({
      full_name: formData.get("full_name"),
      organization: formData.get("organization"),
      designation: String(formData.get("designation") ?? "").trim() || undefined,
      phone: String(formData.get("phone") ?? "").trim() || undefined,
      email: String(formData.get("email") ?? "").trim(),
    });
  const pw = password.safeParse(formData.get("password"));
  if (!pw.success) return { status: "error", code: "weak" };
  if (!parsed.success) return { status: "error", code: "invalid" };

  const supabase = await createServerSupabase();
  const { email, ...meta } = parsed.data;
  const { error } = await supabase.auth.signUp({
    email,
    password: pw.data,
    options: { data: meta, emailRedirectTo: `${SITE_URL}/auth/callback?next=/${locale}/portal` },
  });
  if (error) {
    console.error("[auth] sign-up failed", error.message);
    return { status: "error", code: "generic" };
  }
  return { status: "success" };
}

export async function sendPasswordReset(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const locale = localeOf(formData);
  const email = z.email().safeParse(String(formData.get("email") ?? "").trim());
  if (!email.success) return { status: "error", code: "invalid" };
  if (isPreviewMode) return { status: "error", code: "disabled" };
  const supabase = await createServerSupabase();
  // The response is identical whether or not the account exists.
  await supabase.auth.resetPasswordForEmail(email.data, {
    redirectTo: `${SITE_URL}/auth/callback?next=/${locale}/reset-password`,
  });
  return { status: "success" };
}

export async function updatePassword(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const pw = password.safeParse(formData.get("password"));
  if (!pw.success) return { status: "error", code: "weak" };
  if (isPreviewMode) return { status: "error", code: "disabled" };
  const supabase = await createServerSupabase();
  const { error } = await supabase.auth.updateUser({ password: pw.data });
  if (error) return { status: "error", code: "generic" };
  await supabase.rpc("log_activity", { p_action: "password_reset" });
  return { status: "success" };
}
