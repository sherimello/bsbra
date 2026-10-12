"use server";

import { z } from "zod";
import { isPreviewMode } from "@/lib/env";
import { getPublicSupabase } from "@/lib/supabase/public";

export interface ContactState {
  status: "idle" | "success" | "error";
  message?: string;
  fieldErrors?: Partial<Record<"name" | "email" | "message", true>>;
}

const schema = z.object({
  name: z.string().trim().min(2).max(120),
  email: z.email().max(254),
  phone: z.string().trim().max(40).optional(),
  organization: z.string().trim().max(200).optional(),
  subject: z.string().trim().max(200).optional(),
  message: z.string().trim().min(10).max(5000),
  locale: z.enum(["en", "bn"]),
});

/**
 * Stores a contact message. Bots are filtered by a hidden honeypot field and
 * a minimum fill time; the database enforces lengths and formats again.
 */
export async function submitContact(_prev: ContactState, formData: FormData): Promise<ContactState> {
  const honeypot = String(formData.get("website") ?? "");
  const startedAt = Number(formData.get("started_at") ?? 0);
  if (honeypot || (startedAt && Date.now() - startedAt < 2500)) {
    // Pretend success so automated submitters learn nothing.
    return { status: "success" };
  }

  const opt = (key: string) => {
    const v = String(formData.get(key) ?? "").trim();
    return v ? v : undefined;
  };
  const parsed = schema.safeParse({
    name: formData.get("name"),
    email: String(formData.get("email") ?? "").trim(),
    phone: opt("phone"),
    organization: opt("organization"),
    subject: opt("subject"),
    message: formData.get("message"),
    locale: formData.get("locale"),
  });

  if (!parsed.success) {
    const fields = new Set(parsed.error.issues.map((i) => String(i.path[0])));
    return {
      status: "error",
      fieldErrors: {
        ...(fields.has("name") ? { name: true } : {}),
        ...(fields.has("email") ? { email: true } : {}),
        ...(fields.has("message") ? { message: true } : {}),
      },
    };
  }

  if (isPreviewMode) return { status: "error", message: "preview" };

  const { error } = await getPublicSupabase().from("contact_messages").insert(parsed.data);
  if (error) {
    console.error("[contact] insert failed", error.message);
    return { status: "error" };
  }
  return { status: "success" };
}
