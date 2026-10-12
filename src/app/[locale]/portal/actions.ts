"use server";

import { z } from "zod";
import { isPreviewMode } from "@/lib/env";
import { getViewer } from "@/lib/auth/session";
import { createServerSupabase } from "@/lib/supabase/server";

export interface ProfileState {
  status: "idle" | "success" | "error";
}

/** Updates the signed-in user's own contact details (role/status are guarded in the database). */
export async function updateProfile(_prev: ProfileState, formData: FormData): Promise<ProfileState> {
  const viewer = await getViewer();
  if (!viewer) return { status: "error" };
  const parsed = z
    .object({
      full_name: z.string().trim().min(2).max(120),
      organization: z.string().trim().max(200),
      designation: z.string().trim().max(120),
      phone: z.string().trim().max(40),
    })
    .safeParse({
      full_name: formData.get("full_name"),
      organization: formData.get("organization") ?? "",
      designation: formData.get("designation") ?? "",
      phone: formData.get("phone") ?? "",
    });
  if (!parsed.success) return { status: "error" };
  if (isPreviewMode) return { status: "success" };

  const supabase = await createServerSupabase();
  const values = Object.fromEntries(Object.entries(parsed.data).map(([k, v]) => [k, v || null]));
  const { error } = await supabase.from("profiles").update(values).eq("id", viewer.id);
  return { status: error ? "error" : "success" };
}
