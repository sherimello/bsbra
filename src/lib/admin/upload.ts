"use client";

import { getBrowserSupabase } from "@/lib/supabase/browser";
import { slugify } from "@/lib/utils";

export interface UploadedFile {
  path: string;
  name: string;
  size: number;
  mime: string;
}

const LIMITS: Record<string, number> = { media: 10 * 1024 * 1024, documents: 50 * 1024 * 1024, minutes: 50 * 1024 * 1024 };

/**
 * Uploads straight from the browser to Supabase Storage with the signed-in
 * user's session — large files never pass through the Next.js server, and
 * storage policies decide who may upload where.
 */
export async function uploadFile(bucket: "media" | "documents" | "minutes", folder: string, file: File): Promise<UploadedFile> {
  const supabase = getBrowserSupabase();
  if (!supabase) throw new Error("Uploads are disabled in the preview build. Connect Supabase to enable them.");
  if (file.size > LIMITS[bucket]) throw new Error(`File is too large (max ${Math.round(LIMITS[bucket] / 1024 / 1024)} MB).`);

  const dot = file.name.lastIndexOf(".");
  const ext = dot > 0 ? file.name.slice(dot + 1).toLowerCase().replace(/[^a-z0-9]/g, "") : "bin";
  const base = slugify(dot > 0 ? file.name.slice(0, dot) : file.name, "file").slice(0, 60);
  const stamp = new Date().toISOString().slice(0, 7);
  const path = `${folder}/${stamp}/${crypto.randomUUID().slice(0, 8)}-${base}.${ext}`;

  const { error } = await supabase.storage.from(bucket).upload(path, file, {
    cacheControl: "31536000",
    contentType: file.type || undefined,
    upsert: false,
  });
  if (error) throw new Error(error.message);
  return { path, name: file.name, size: file.size, mime: file.type };
}
