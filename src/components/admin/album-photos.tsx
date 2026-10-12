"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { ImagePlus, Loader2, Plus } from "lucide-react";
import { mediaUrl } from "@/lib/env";
import { uploadFile } from "@/lib/admin/upload";
import { addPhotos } from "@/lib/admin/actions";
import type { Photo } from "@/lib/types";

/** Photographs in an album, with drag-free bulk upload. */
export function AlbumPhotos({ albumId, photos }: { albumId: string; photos: Photo[] }) {
  const router = useRouter();
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(0);

  const upload = async (files: FileList | null) => {
    if (!files?.length) return;
    const list = Array.from(files).slice(0, 50);
    setBusy(list.length);
    const paths: string[] = [];
    for (const file of list) {
      try {
        paths.push((await uploadFile("media", `albums/${albumId}`, file)).path);
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Upload failed.");
        break;
      } finally {
        setBusy((n) => n - 1);
      }
    }
    if (paths.length) {
      const result = await addPhotos(albumId, paths);
      if (result.ok) {
        toast.success(`${paths.length} photo${paths.length > 1 ? "s" : ""} added`);
        router.refresh();
      } else toast.error(result.error ?? "Could not add photos.");
    }
    setBusy(0);
  };

  return (
    <section className="mb-6 rounded-[var(--radius-card)] bg-surface p-6 hairline sm:p-8">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-[1.0625rem] font-semibold tracking-[-0.015em]">Photos ({photos.length})</h2>
        <div className="flex gap-2">
          <Link href={`/admin/photos/new?album_id=${albumId}`} className="press inline-flex h-9 items-center gap-1.5 rounded-full px-4 text-[0.8125rem] font-medium hairline hover:bg-bg-muted">
            <Plus className="size-4" /> Video or single photo
          </Link>
          <button
            type="button"
            onClick={() => input.current?.click()}
            disabled={busy > 0}
            className="press inline-flex h-9 items-center gap-1.5 rounded-full bg-brand px-4 text-[0.8125rem] font-medium text-brand-fg disabled:opacity-60"
          >
            {busy > 0 ? <Loader2 className="size-4 animate-spin" /> : <ImagePlus className="size-4" />}
            {busy > 0 ? `Uploading ${busy}…` : "Upload photos"}
          </button>
          <input ref={input} type="file" multiple accept="image/jpeg,image/png,image/webp,image/avif" className="sr-only" onChange={(e) => { upload(e.target.files); e.target.value = ""; }} />
        </div>
      </div>
      {photos.length === 0 ? (
        <p className="text-[0.875rem] text-fg-subtle">No photos yet. Upload several at once — they are added in the order selected.</p>
      ) : (
        <ul className="grid grid-cols-3 gap-3 sm:grid-cols-5 lg:grid-cols-8">
          {photos.map((p) => (
            <li key={p.id}>
              <Link href={`/admin/photos/${p.id}`} className="group relative block aspect-square overflow-hidden rounded-xl bg-bg-muted hairline" title={p.caption_en ?? "Edit photo"}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                {p.image_path && <img src={mediaUrl(p.image_path) ?? ""} alt="" className="absolute inset-0 h-full w-full object-cover transition-transform group-hover:scale-105" />}
                {!p.image_path && p.video_url && <span className="absolute inset-0 grid place-items-center text-[0.75rem] text-fg-subtle">Video</span>}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
