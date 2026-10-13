import Image from "next/image";
import Link from "next/link";
import type { Locale } from "@/lib/i18n/config";
import type { PhotoCredit } from "@/lib/media/photos";
import { cn } from "@/lib/utils";

/** "Photo: Author · Licence" — links to the credits page, as the licences require. */
export function PhotoCreditLink({
  photo,
  locale,
  className,
  onImage,
}: {
  photo: PhotoCredit;
  locale: Locale;
  className?: string;
  /** Style for placement over the photograph itself. */
  onImage?: boolean;
}) {
  return (
    <Link
      href={`/${locale}/credits#${photo.src.split("/").pop()?.replace(/\.\w+$/, "")}`}
      className={cn(
        "text-[0.6875rem] leading-tight transition-colors",
        onImage
          ? "rounded-full bg-black/35 px-2.5 py-1 text-white/90 backdrop-blur-md hover:bg-black/50"
          : "text-fg-faint hover:text-fg-subtle",
        className,
      )}
    >
      {locale === "bn" ? "ছবি" : "Photo"}: {photo.author} · {photo.license}
    </Link>
  );
}

/** A rounded photograph with its credit, sized responsively by next/image. */
export function PhotoFigure({
  photo,
  locale,
  className,
  aspect = "aspect-[16/9]",
  sizes = "(min-width: 1280px) 1240px, 100vw",
  priority,
  children,
}: {
  photo: PhotoCredit;
  locale: Locale;
  className?: string;
  aspect?: string;
  sizes?: string;
  priority?: boolean;
  children?: React.ReactNode;
}) {
  return (
    <figure className={cn("art-frame relative rounded-[var(--radius-tile)]", aspect, className)}>
      <Image
        src={photo.src}
        alt={locale === "bn" ? photo.alt_bn : photo.alt_en}
        fill
        sizes={sizes}
        loading={priority ? "eager" : undefined}
        fetchPriority={priority ? "high" : undefined}
        className="photo-zoom object-cover"
      />
      {children}
      <figcaption className="absolute right-3 bottom-3 sm:right-4 sm:bottom-4">
        <PhotoCreditLink photo={photo} locale={locale} onImage />
      </figcaption>
    </figure>
  );
}
