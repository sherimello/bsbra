"use client";

import { useRef, useState } from "react";
import { toast } from "sonner";
import { FileUp, ImagePlus, Loader2, Paperclip, Trash2, X } from "lucide-react";
import { mediaUrl } from "@/lib/env";
import { uploadFile } from "@/lib/admin/upload";
import { cn, formatBytes } from "@/lib/utils";

function useUploader() {
  const [busy, setBusy] = useState(false);
  const run = async <T,>(task: () => Promise<T>) => {
    setBusy(true);
    try {
      return await task();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Upload failed.");
      return null;
    } finally {
      setBusy(false);
    }
  };
  return { busy, run };
}

export function ImageField({
  id,
  value,
  onChange,
  folder,
  disabled,
}: {
  id: string;
  value: string | null;
  onChange: (value: string | null) => void;
  folder: string;
  disabled?: boolean;
}) {
  const input = useRef<HTMLInputElement>(null);
  const { busy, run } = useUploader();
  const url = mediaUrl(value);

  const pick = async (file: File | undefined) => {
    if (!file) return;
    const res = await run(() => uploadFile("media", folder, file));
    if (res) onChange(res.path);
  };

  return (
    <div className="flex items-center gap-4">
      <div className="relative grid size-24 shrink-0 place-items-center overflow-hidden rounded-xl bg-bg-muted hairline">
        {url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={url} alt="" className="absolute inset-0 h-full w-full object-cover" />
        ) : (
          <ImagePlus className="size-6 text-fg-faint" />
        )}
        {busy && (
          <span className="absolute inset-0 grid place-items-center bg-black/40">
            <Loader2 className="size-5 animate-spin text-white" />
          </span>
        )}
      </div>
      <div className="flex flex-col gap-2">
        <input
          ref={input}
          id={id}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/avif,image/gif"
          className="sr-only"
          onChange={(e) => {
            pick(e.target.files?.[0]);
            e.target.value = "";
          }}
        />
        <button
          type="button"
          disabled={disabled || busy}
          onClick={() => input.current?.click()}
          className="press inline-flex h-9 items-center gap-2 rounded-full bg-bg-muted px-4 text-[0.8125rem] font-medium hover:bg-line-strong disabled:opacity-50"
        >
          <FileUp className="size-4" />
          {value ? "Replace" : "Upload image"}
        </button>
        {value && (
          <button type="button" onClick={() => onChange(null)} className="inline-flex items-center gap-1.5 text-[0.75rem] text-danger hover:underline">
            <Trash2 className="size-3.5" />
            Remove
          </button>
        )}
        <span className="text-[0.75rem] text-fg-faint">JPG, PNG, WebP or AVIF · max 10 MB</span>
      </div>
    </div>
  );
}

export function ImagesField({
  id,
  value,
  onChange,
  folder,
  disabled,
}: {
  id: string;
  value: string[];
  onChange: (value: string[]) => void;
  folder: string;
  disabled?: boolean;
}) {
  const input = useRef<HTMLInputElement>(null);
  const { busy, run } = useUploader();

  const pick = async (files: FileList | null) => {
    if (!files?.length) return;
    const uploaded: string[] = [];
    for (const file of Array.from(files).slice(0, 20)) {
      const res = await run(() => uploadFile("media", folder, file));
      if (res) uploaded.push(res.path);
    }
    if (uploaded.length) onChange([...value, ...uploaded]);
  };

  return (
    <div>
      <ul className="grid grid-cols-3 gap-3 sm:grid-cols-5">
        {value.map((path) => (
          <li key={path} className="group relative aspect-square overflow-hidden rounded-xl bg-bg-muted hairline">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={mediaUrl(path) ?? ""} alt="" className="absolute inset-0 h-full w-full object-cover" />
            <button
              type="button"
              onClick={() => onChange(value.filter((p) => p !== path))}
              className="absolute top-1.5 right-1.5 grid size-6 place-items-center rounded-full bg-black/60 text-white opacity-0 transition-opacity group-hover:opacity-100 focus:opacity-100"
              aria-label="Remove image"
            >
              <X className="size-3.5" />
            </button>
          </li>
        ))}
        <li>
          <button
            type="button"
            disabled={disabled || busy}
            onClick={() => input.current?.click()}
            className="grid aspect-square w-full place-items-center rounded-xl border border-dashed border-line-strong text-fg-subtle hover:bg-bg-muted disabled:opacity-50"
            aria-label="Add images"
          >
            {busy ? <Loader2 className="size-5 animate-spin" /> : <ImagePlus className="size-5" />}
          </button>
        </li>
      </ul>
      <input
        ref={input}
        id={id}
        type="file"
        multiple
        accept="image/jpeg,image/png,image/webp,image/avif,image/gif"
        className="sr-only"
        onChange={(e) => {
          pick(e.target.files);
          e.target.value = "";
        }}
      />
    </div>
  );
}

export interface FileValue {
  path: string | null;
  name: string | null;
  size: number | null;
  mime: string | null;
}

export function FileField({
  id,
  value,
  onChange,
  bucket,
  folder,
  disabled,
  accept,
}: {
  id: string;
  value: FileValue;
  onChange: (value: FileValue) => void;
  bucket: "documents" | "minutes";
  folder: string;
  disabled?: boolean;
  accept?: string;
}) {
  const input = useRef<HTMLInputElement>(null);
  const { busy, run } = useUploader();

  const pick = async (file: File | undefined) => {
    if (!file) return;
    const res = await run(() => uploadFile(bucket, folder, file));
    if (res) onChange({ path: res.path, name: res.name, size: res.size, mime: res.mime });
  };

  return (
    <div className={cn("flex flex-wrap items-center gap-3 rounded-xl bg-bg-subtle p-3", busy && "opacity-70")}>
      <span className="grid size-10 place-items-center rounded-lg bg-surface hairline">
        {busy ? <Loader2 className="size-4 animate-spin" /> : <Paperclip className="size-4 text-fg-subtle" />}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-[0.875rem] font-medium text-fg">{value.path ? value.name ?? value.path.split("/").pop() : "No file uploaded"}</span>
        {value.size ? <span className="text-[0.75rem] text-fg-subtle">{formatBytes(value.size)}</span> : null}
      </span>
      <input
        ref={input}
        id={id}
        type="file"
        accept={accept}
        className="sr-only"
        onChange={(e) => {
          pick(e.target.files?.[0]);
          e.target.value = "";
        }}
      />
      <button
        type="button"
        disabled={disabled || busy}
        onClick={() => input.current?.click()}
        className="press inline-flex h-9 items-center gap-2 rounded-full bg-surface px-4 text-[0.8125rem] font-medium hairline hover:bg-bg-muted disabled:opacity-50"
      >
        <FileUp className="size-4" />
        {value.path ? "Replace file" : "Upload file"}
      </button>
      {value.path && (
        <button
          type="button"
          onClick={() => onChange({ path: null, name: null, size: null, mime: null })}
          className="press grid size-9 place-items-center rounded-full text-danger hover:bg-danger-soft"
          aria-label="Remove file"
        >
          <Trash2 className="size-4" />
        </button>
      )}
    </div>
  );
}
