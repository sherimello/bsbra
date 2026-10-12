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
    <Image src={url} alt={alt} fill sizes={sizes} priority={priority} className={cn("object-cover", className)} />
  ) : (
    <Image src={url} alt={alt} width={width ?? 1600} height={height ?? 1000} sizes={sizes} priority={priority} className={cn("object-cover", className)} />
  );
}

/** Light artwork from public/art, used wherever an image hasn't been uploaded yet. */
const placeholderArt = ["tidal-flat", "meridian", "shoreline", "harbour", "estuary", "monsoon", "sandbar", "lagoon", "ridge", "swell"];

export function ImagePlaceholder({ seed = "", className }: { seed?: string; className?: string }) {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  const art = placeholderArt[hash % placeholderArt.length];
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={`/art/${art}.svg`}
      alt=""
      aria-hidden
      loading="lazy"
      decoding="async"
      className={cn("absolute inset-0 h-full w-full object-cover", className)}
    />
  );
}
