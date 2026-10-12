import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { notFound } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { getDictionary, href, isLocale } from "@/lib/i18n";
import { tr } from "@/lib/i18n/tr";
import { formatDate } from "@/lib/i18n/format";
import { mediaUrl } from "@/lib/env";
import { pageMetadata } from "@/lib/seo";
import { getAlbum, getStaticIds } from "@/lib/data/public";
import { Container } from "@/components/ui/container";
import { EmptyState } from "@/components/ui/empty-state";
import { PhotoGrid } from "@/components/site/photo-grid";
import { Reveal } from "@/components/motion/reveal";

export async function generateStaticParams() {
  const slugs = await getStaticIds("albums", "slug", 20);
  return (slugs.length ? slugs : ["album"]).map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: PageProps<"/[locale]/gallery/[slug]">): Promise<Metadata> {
  const { locale, slug } = await params;
  if (!isLocale(locale)) return {};
  const data = await getAlbum(slug);
  if (!data) return {};
  return pageMetadata({
    locale,
    path: `/gallery/${slug}`,
    title: tr(data.album, "title", locale),
    description: tr(data.album, "description", locale) || undefined,
    image: mediaUrl(data.album.cover_image),
  });
}

export default function AlbumPage({ params }: PageProps<"/[locale]/gallery/[slug]">) {
  return (
    <Suspense fallback={<Container className="py-20"><div className="skeleton h-[480px] rounded-[var(--radius-tile)]" /></Container>}>
      <Album params={params} />
    </Suspense>
  );
}

async function Album({ params }: { params: PageProps<"/[locale]/gallery/[slug]">["params"] }) {
  const { locale, slug } = await params;
  if (!isLocale(locale)) notFound();
  const data = await getAlbum(slug);
  if (!data) notFound();
  const t = getDictionary(locale);
  const { album, photos } = data;

  return (
    <Container className="py-10 sm:py-14">
      <Link href={href(locale, "/gallery")} className="inline-flex items-center gap-1 text-[0.875rem] text-link hover:underline">
        <ChevronLeft className="size-4" />
        {t.gallery.back}
      </Link>
      <Reveal className="mt-8 mb-10 max-w-3xl">
        <p className="text-eyebrow text-fg-subtle">
          {t.labels.albumCategory[album.category]}
          {album.event_date && ` · ${formatDate(locale, album.event_date, "long")}`}
        </p>
        <h1 className="text-headline mt-3">{tr(album, "title", locale)}</h1>
        {album.description_en && <p className="text-lede mt-4 text-fg-subtle">{tr(album, "description", locale)}</p>}
      </Reveal>
      {photos.length === 0 ? (
        <EmptyState title={t.gallery.albumEmpty} />
      ) : (
        <PhotoGrid
          photos={photos.map((p) => ({
            id: p.id,
            src: mediaUrl(p.image_path),
            video: p.video_url,
            caption: tr(p, "caption", locale),
            credit: p.credit,
            download: p.allow_download,
            width: p.width,
            height: p.height,
          }))}
          labels={{
            close: t.gallery.closeViewer,
            previous: t.gallery.previousPhoto,
            next: t.gallery.nextPhoto,
            download: t.gallery.downloadOriginal,
          }}
        />
      )}
    </Container>
  );
}
