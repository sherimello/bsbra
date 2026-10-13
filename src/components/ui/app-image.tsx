import Image from "next/image";
import { mediaUrl } from "@/lib/env";
import { cn } from "@/lib/utils";

/**
 * Images from Supabase Storage go through next/image (AVIF/WebP, responsive
 * sizes). SVG artwork bundled in /public is served as-is.
 * Missing images fall back to a piece of the contour artwork.
 */
export function AppImage({
  src,
  alt,
  className,
  sizes = "(min-width: 1024px) 33vw, 100vw",
  priority,
  fill = true,
  width,
  height,
  seed,
}: {
  src: string | null | undefined;
  alt: string;
  className?: string;
  sizes?: string;
  priority?: boolean;
  fill?: boolean;
  width?: number;
  height?: number;
  seed?: string;
}) {
  const url = mediaUrl(src);
  if (!url) return <ImagePlaceholder seed={seed ?? alt} className={className} />;

  if (url.endsWith(".svg")) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={url}
        alt={alt}
        width={width}
        height={height}
        loading={priority ? "eager" : "lazy"}
        decoding="async"
        className={cn(fill && "absolute inset-0 h-full w-full", "object-cover", className)}
      />
    );
  }

  return fill ? (
    <Image src={url} alt={alt} fill sizes={sizes} loading={priority ? "eager" : undefined} fetchPriority={priority ? "high" : undefined} className={cn("object-cover", className)} />
  ) : (
    <Image src={url} alt={alt} width={width ?? 1600} height={height ?? 1000} sizes={sizes} loading={priority ? "eager" : undefined} fetchPriority={priority ? "high" : undefined} className={cn("object-cover", className)} />
  );
}

/** Fallback authentic photography from public/photos used when an image hasn't been uploaded yet. */
const placeholderPhotos = [
  "/photos/imo-green-yard.jpg",
  "/photos/bulk-carrier-recycling.jpg",
  "/photos/ksrm-yard-visit-2025.jpg",
  "/photos/sitakunda-cranes.jpg",
  "/photos/chattogram-yard.jpg",
  "/photos/bhatiary-gas-cutting.jpg",
  "/photos/imo-green-recycling-sustainable.jpg",
  "/photos/chittagong-demolition-yard.jpg",
  "/photos/ziri-subedar-inspection-1.jpg",
  "/photos/beached-bow.jpg",
];

export function ImagePlaceholder({ seed = "", className }: { seed?: string; className?: string }) {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  const photo = placeholderPhotos[hash % placeholderPhotos.length];
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={photo}
      alt=""
      aria-hidden
      loading="lazy"
      decoding="async"
      className={cn("absolute inset-0 h-full w-full object-cover", className)}
    />
  );
}
