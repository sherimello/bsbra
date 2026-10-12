"use server";

import { updateTag } from "next/cache";
import { z } from "zod";
import { isPreviewMode } from "@/lib/env";
import { getViewer } from "@/lib/auth/session";
import { assignableRoles, can, canManageUser, isAdmin, isEditor, isStaff, ROLES } from "@/lib/auth/permissions";
import { createServerSupabase } from "@/lib/supabase/server";
import { getServiceSupabase } from "@/lib/supabase/admin";
import type { Role } from "@/lib/types";
import { getResource, SETTINGS_FIELDS } from "./resources";
import { coerceValues, describeDbError, type FieldErrors } from "./validate";

export interface ActionResult {
  ok: boolean;
  id?: string;
  error?: string;
  fieldErrors?: FieldErrors;
}

const PREVIEW_ERROR = "This is a preview build. Connect Supabase (see README) to save changes.";

function refresh(table: string) {
  updateTag(table);
  updateTag("search");
}

async function staffOrError() {
  const viewer = await getViewer();
  if (!viewer || !isStaff(viewer.role)) return { viewer: null, error: "Your session has expired. Please sign in again." } as const;
  return { viewer, error: null } as const;
}

/** Creates (id = null) or updates a record of any configured resource. */
export async function saveRecord(key: string, id: string | null, input: Record<string, unknown>): Promise<ActionResult> {
  const resource = getResource(key);
  if (!resource) return { ok: false, error: "Unknown section." };
  const { viewer, error } = await staffOrError();
  if (!viewer) return { ok: false, error };
  if (!can(viewer.role, id ? "edit" : "create", resource.permission)) return { ok: false, error: "You don't have permission to make this change." };

  const { values, errors } = coerceValues(resource.fields, input);

  if (resource.editorial && !isEditor(viewer.role) && !["draft", "review"].includes(String(values.status))) {
    errors.status = "Only editors can publish or archive. Save as Draft or In review.";
  }
  if (resource.table === "documents" && !values.file_path && !values.external_url) {
    errors.file_path = "Upload a file or provide an external link.";
  }
  if (Object.keys(errors).length) return { ok: false, error: "Please correct the highlighted fields.", fieldErrors: errors };
  if (isPreviewMode) return { ok: false, error: PREVIEW_ERROR };

  const supabase = await createServerSupabase();
  const query = id
    ? supabase.from(resource.table).update(values).eq("id", id).select("id").single()
    : supabase.from(resource.table).insert(values).select("id").single();
  const { data, error: dbError } = await query;
  if (dbError) return { ok: false, error: describeDbError(dbError) };

  refresh(resource.table);
  return { ok: true, id: data.id as string };
}

export async function deleteRecord(key: string, id: string): Promise<ActionResult> {
  const resource = getResource(key);
  if (!resource) return { ok: false, error: "Unknown section." };
  const { viewer, error } = await staffOrError();
  if (!viewer) return { ok: false, error };
  if (!can(viewer.role, "delete", resource.permission)) return { ok: false, error: "Only editors and administrators can delete." };
  if (isPreviewMode) return { ok: false, error: PREVIEW_ERROR };

  const supabase = await createServerSupabase();
  const { error: dbError, count } = await supabase.from(resource.table).delete({ count: "exact" }).eq("id", id);
  if (dbError) return { ok: false, error: describeDbError(dbError) };
  if (!count) return { ok: false, error: "Nothing was deleted — you may not have permission." };
  refresh(resource.table);
  return { ok: true };
}

export async function saveSettings(input: Record<string, unknown>): Promise<ActionResult> {
  const viewer = await getViewer();
  if (!viewer || !isAdmin(viewer.role)) return { ok: false, error: "Only administrators can change site settings." };
  const { values, errors } = coerceValues(SETTINGS_FIELDS, input);
  if (Object.keys(errors).length) return { ok: false, error: "Please correct the highlighted fields.", fieldErrors: errors };
  if (isPreviewMode) return { ok: false, error: PREVIEW_ERROR };
  const supabase = await createServerSupabase();
  const { error } = await supabase.from("site_settings").update(values).eq("id", 1);
  if (error) return { ok: false, error: describeDbError(error) };
  updateTag("site_settings");
  return { ok: true };
}

/** Adds uploaded photographs (already in storage) to an album. */
export async function addPhotos(albumId: string, paths: string[]): Promise<ActionResult> {
  const { viewer, error } = await staffOrError();
  if (!viewer) return { ok: false, error };
  if (!z.uuid().safeParse(albumId).success || !paths.length) return { ok: false, error: "Nothing to add." };
  if (isPreviewMode) return { ok: false, error: PREVIEW_ERROR };
  const supabase = await createServerSupabase();
  const { count } = await supabase.from("photos").select("id", { count: "exact", head: true }).eq("album_id", albumId);
  const rows = paths.slice(0, 100).map((image_path, i) => ({ album_id: albumId, image_path, sort_order: (count ?? 0) + i + 1 }));
  const { error: dbError } = await supabase.from("photos").insert(rows);
  if (dbError) return { ok: false, error: describeDbError(dbError) };
  refresh("photos");
  return { ok: true };
}

// ---------------------------------------------------------------------------
// User management
// ---------------------------------------------------------------------------
export async function setUserRole(userId: string, role: Role): Promise<ActionResult> {
  const viewer = await getViewer();
  if (!viewer || !isAdmin(viewer.role)) return { ok: false, error: "Only administrators can change roles." };
  if (!ROLES.includes(role) || !assignableRoles(viewer.role).includes(role)) return { ok: false, error: "You can't assign that role." };
  if (userId === viewer.id) return { ok: false, error: "You can't change your own role." };
  if (isPreviewMode) return { ok: false, error: PREVIEW_ERROR };
  const supabase = await createServerSupabase();
  const { data: target } = await supabase.from("profiles").select("role").eq("id", userId).maybeSingle();
  if (!target || !canManageUser(viewer.role, target.role as Role)) return { ok: false, error: "You can't manage this account." };
  const { error } = await supabase.from("profiles").update({ role }).eq("id", userId);
  if (error) return { ok: false, error: describeDbError(error) };
  updateTag("profiles");
  return { ok: true };
}

export async function setUserActive(userId: string, active: boolean): Promise<ActionResult> {
  const viewer = await getViewer();
  if (!viewer || !isAdmin(viewer.role)) return { ok: false, error: "Only administrators can change account status." };
  if (userId === viewer.id) return { ok: false, error: "You can't deactivate your own account." };
  if (isPreviewMode) return { ok: false, error: PREVIEW_ERROR };
  const supabase = await createServerSupabase();
  const { error } = await supabase.from("profiles").update({ is_active: active }).eq("id", userId);
  if (error) return { ok: false, error: describeDbError(error) };
  updateTag("profiles");
  return { ok: true };
}

const inviteSchema = z.object({
  email: z.email(),
  full_name: z.string().trim().min(2).max(120),
  organization: z.string().trim().max(200).optional(),
  role: z.enum(ROLES as [Role, ...Role[]]),
});

/** Sends a Supabase invitation e-mail and assigns the role once the profile exists. */
export async function inviteUser(input: { email: string; full_name: string; organization?: string; role: Role }): Promise<ActionResult> {
  const viewer = await getViewer();
  if (!viewer || !isAdmin(viewer.role)) return { ok: false, error: "Only administrators can invite users." };
  const parsed = inviteSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Enter a name, a valid email and a role." };
  if (!assignableRoles(viewer.role).includes(parsed.data.role)) return { ok: false, error: "You can't assign that role." };
  if (isPreviewMode) return { ok: false, error: PREVIEW_ERROR };

  const service = getServiceSupabase();
  if (!service) return { ok: false, error: "Set SUPABASE_SECRET_KEY on the server to enable invitations." };
  const { SITE_URL } = await import("@/lib/env");
  const { data, error } = await service.auth.admin.inviteUserByEmail(parsed.data.email, {
    data: { full_name: parsed.data.full_name, organization: parsed.data.organization },
    redirectTo: `${SITE_URL}/auth/callback?next=/en/reset-password`,
  });
  if (error || !data.user) return { ok: false, error: error?.message ?? "The invitation could not be sent." };

  // The profile row is created by the on_auth_user_created trigger.
  await service.from("profiles").update({ role: parsed.data.role }).eq("id", data.user.id);
  const supabase = await createServerSupabase();
  await supabase.rpc("log_activity", { p_action: "invite", p_target: parsed.data.email, p_details: { role: parsed.data.role } });
  updateTag("profiles");
  return { ok: true, id: data.user.id };
}

// ---------------------------------------------------------------------------
// Tide import
// ---------------------------------------------------------------------------
const tideRow = z.object({
  station: z.string().trim().min(1).max(120),
  tide_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  tide_time: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d(:[0-5]\d)?$/),
  tide_type: z.enum(["high", "low"]),
  height_m: z.number().min(-5).max(15),
});

export async function importTides(rows: unknown[], replaceRange: boolean): Promise<ActionResult & { imported?: number }> {
  const { viewer, error } = await staffOrError();
  if (!viewer) return { ok: false, error };
  const parsed = z.array(tideRow).min(1).max(5000).safeParse(rows);
  if (!parsed.success) return { ok: false, error: "Some rows are invalid. Check the preview and try again." };
  if (replaceRange && !isEditor(viewer.role)) return { ok: false, error: "Only editors can replace existing tide data." };
  if (isPreviewMode) return { ok: false, error: PREVIEW_ERROR };

  const data = parsed.data.map((r) => ({ ...r, tide_time: r.tide_time.length === 5 ? `${r.tide_time}:00` : r.tide_time }));
  const supabase = await createServerSupabase();

  if (replaceRange) {
    const stations = [...new Set(data.map((r) => r.station))];
    const dates = data.map((r) => r.tide_date).sort();
    const { error: delError } = await supabase
      .from("tide_entries")
      .delete()
      .in("station", stations)
      .gte("tide_date", dates[0])
      .lte("tide_date", dates[dates.length - 1]);
    if (delError) return { ok: false, error: describeDbError(delError) };
  }

  for (let i = 0; i < data.length; i += 500) {
    const { error: upsertError } = await supabase
      .from("tide_entries")
      .upsert(data.slice(i, i + 500), { onConflict: "station,tide_date,tide_time" });
    if (upsertError) return { ok: false, error: describeDbError(upsertError) };
  }

  await supabase.rpc("log_activity", { p_action: "import", p_target: "tide_entries", p_details: { rows: data.length, replaced: replaceRange } });
  refresh("tide_entries");
  return { ok: true, imported: data.length };
}
