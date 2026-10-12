import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { Images } from "lucide-react";
import { getDictionary, href, resolveLocale, type Dictionary, type Locale } from "@/lib/i18n";
import { tr } from "@/lib/i18n/tr";
import { formatDate, formatNumber } from "@/lib/i18n/format";
import { pageMetadata } from "@/lib/seo";
import { getAlbums } from "@/lib/data/public";
import type { AlbumCategory } from "@/lib/types";
import { PageHero } from "@/components/site/page-hero";
import { Container } from "@/components/ui/container";
import { FilterPills } from "@/components/ui/filter-pills";
import { AppImage } from "@/components/ui/app-image";
import { cn } from "@/lib/utils";
import { EmptyState } from "@/components/ui/empty-state";
import { RevealGroup, RevealItem } from "@/components/motion/reveal";

export async function generateMetadata({ params }: PageProps<"/[locale]/gallery">): Promise<Metadata> {
  const locale = await resolveLocale(params);
  const t = getDictionary(locale);
  return pageMetadata({ locale, path: "/gallery", title: t.nav.gallery, description: t.gallery.lede });
}

export default async function GalleryPage({ params, searchParams }: PageProps<"/[locale]/gallery">) {
  const locale = await resolveLocale(params);
  const t = getDictionary(locale);
  return (
    <>
      <PageHero eyebrow={t.gallery.eyebrow} title={t.gallery.title} lede={t.gallery.lede} />
      <Container className="pb-24">
        <Suspense fallback={<div className="skeleton h-[480px] rounded-[var(--radius-tile)]" />}>
          <AlbumGrid locale={locale} t={t} searchParams={searchParams} />
        </Suspense>
      </Container>
    </>
  );
}

async function AlbumGrid({ locale, t, searchParams }: { locale: Locale; t: Dictionary; searchParams: PageProps<"/[locale]/gallery">["searchParams"] }) {
  const sp = await searchParams;
  const albums = await getAlbums();
  const categories = [...new Set(albums.map((a) => a.category))] as AlbumCategory[];
  const raw = Array.isArray(sp.category) ? sp.category[0] : sp.category;
  const category = categories.includes(raw as AlbumCategory) ? (raw as AlbumCategory) : null;
  const shown = category ? albums.filter((a) => a.category === category) : albums;
  const path = href(locale, "/gallery");

  if (!albums.length) return <EmptyState icon={<Images />} title={t.gallery.empty} />;

  return (
    <>
      <FilterPills
        label={t.common.filter}
        className="mb-10"
        items={[
          { label: t.gallery.allCategories, href: path, active: !category },
          ...categories.map((c) => ({ label: t.labels.albumCategory[c], href: `${path}?category=${c}`, active: c === category })),
        ]}
      />
      <RevealGroup className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {shown.map((album, i) => (
          <RevealItem key={album.id} className={i === 0 && !category ? "sm:col-span-2 lg:row-span-2" : undefined}>
            <Link href={href(locale, `/gallery/${album.slug}`)} className="group flex h-full flex-col">
              <div className={cn("art-frame min-h-60 flex-1 rounded-[var(--radius-tile)]", i === 0 && !category && "lg:min-h-[30rem]")}>
              <AppImage
                src={album.cover_image}
                alt=""
                seed={album.slug}
                sizes={i === 0 ? "(min-width: 1024px) 66vw, 100vw" : "(min-width: 1024px) 33vw, 100vw"}
                className="transition-transform duration-[1.4s] ease-[var(--ease-out-quint)] group-hover:scale-105"
              />
              </div>
              <div className="px-1 pt-4">
                <p className="text-[0.8125rem] text-fg-subtle">
                  {t.labels.albumCategory[album.category]}
                  {album.event_date && ` · ${formatDate(locale, album.event_date, "monthYear")}`}
                </p>
                <h2 className="mt-1 text-[1.375rem] leading-tight font-semibold tracking-[-0.022em] text-fg">{tr(album, "title", locale)}</h2>
                <p className="mt-1 text-[0.8125rem] text-fg-faint tabular">
                  {formatNumber(locale, album.photo_count)} {t.gallery.photos}
                </p>
              </div>
            </Link>
          </RevealItem>
        ))}
      </RevealGroup>
    </>
  );
}
