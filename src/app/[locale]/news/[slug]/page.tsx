import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { notFound } from "next/navigation";
import { ArrowUpRight, Calendar, ChevronLeft, MapPin } from "lucide-react";
import { getDictionary, href, isLocale } from "@/lib/i18n";
import { tr } from "@/lib/i18n/tr";
import { formatDate } from "@/lib/i18n/format";
import { SITE_URL, mediaUrl } from "@/lib/env";
import { pageMetadata } from "@/lib/seo";
import { getLatestPosts, getPost, getStaticIds } from "@/lib/data/public";
import { videoEmbedUrl } from "@/lib/utils";
import { Container } from "@/components/ui/container";
import { Badge } from "@/components/ui/badge";
import { AppImage } from "@/components/ui/app-image";
import { Markdown } from "@/components/ui/markdown";
import { ButtonLink } from "@/components/ui/button";
import { PostCard } from "@/components/site/post-card";
import { ShareButton } from "@/components/site/share-button";
import { Reveal } from "@/components/motion/reveal";

export async function generateStaticParams() {
  const slugs = await getStaticIds("posts", "slug", 20);
  return (slugs.length ? slugs : ["welcome"]).map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: PageProps<"/[locale]/news/[slug]">): Promise<Metadata> {
  const { locale, slug } = await params;
  if (!isLocale(locale)) return {};
  const post = await getPost(slug);
  if (!post) return {};
  return pageMetadata({
    locale,
    path: `/news/${slug}`,
    title: tr(post, "title", locale),
    description: tr(post, "excerpt", locale),
    image: mediaUrl(post.cover_image),
    type: "article",
  });
}

export default function ArticlePage({ params }: PageProps<"/[locale]/news/[slug]">) {
  return (
    <Suspense
      fallback={
        <Container size="narrow" className="py-20">
          <div className="skeleton h-10 w-3/4 rounded-full" />
          <div className="skeleton mt-8 aspect-[16/9] rounded-[var(--radius-tile)]" />
        </Container>
      }
    >
      <Article params={params} />
    </Suspense>
  );
}

async function Article({ params }: { params: PageProps<"/[locale]/news/[slug]">["params"] }) {
  const { locale, slug } = await params;
  if (!isLocale(locale)) notFound();
  const post = await getPost(slug);
  if (!post) notFound();
  const t = getDictionary(locale);
  const related = await getLatestPosts([post.type], 3, post.slug);
  const title = tr(post, "title", locale);
  const embed = videoEmbedUrl(post.video_url);
  const url = `${SITE_URL}/${locale}/news/${post.slug}`;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": post.type === "event" ? "Event" : "NewsArticle",
    headline: title,
    ...(post.type === "event"
      ? { name: title, startDate: post.event_date, location: { "@type": "Place", name: tr(post, "event_location", locale) } }
      : { datePublished: post.published_at, dateModified: post.updated_at }),
    publisher: { "@type": "Organization", name: t.meta.siteName },
    url,
  };

  return (
    <article>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />
      <Container size="narrow" className="pt-10 sm:pt-14">
        <Link href={href(locale, "/news")} className="inline-flex items-center gap-1 text-[0.875rem] text-link hover:underline">
          <ChevronLeft className="size-4" />
          {t.news.back}
        </Link>
        <Reveal className="mt-8">
          <div className="flex flex-wrap items-center gap-3 text-[0.875rem] text-fg-subtle">
            <Badge tone="brand">{t.labels.postType[post.type]}</Badge>
            <time dateTime={post.published_at ?? undefined}>{formatDate(locale, post.published_at, "long")}</time>
            {post.source_name && <span>· {post.source_name}</span>}
          </div>
          <h1 className="text-headline mt-5 text-balance">{title}</h1>
          {post.excerpt_en && <p className="text-lede mt-5 text-fg-subtle">{tr(post, "excerpt", locale)}</p>}
          {post.event_date && (
            <div className="mt-6 flex flex-wrap gap-x-6 gap-y-2 rounded-[var(--radius-card)] bg-bg-subtle px-5 py-4 text-[0.9375rem]">
              <span className="inline-flex items-center gap-2">
                <Calendar className="size-4 text-brand" />
                <span className="text-fg-subtle">{t.news.eventDate}:</span>
                <span className="font-medium">{formatDate(locale, post.event_date, "long")}</span>
              </span>
              {post.event_location_en && (
                <span className="inline-flex items-center gap-2">
                  <MapPin className="size-4 text-brand" />
                  <span className="text-fg-subtle">{t.news.venue}:</span>
                  <span className="font-medium">{tr(post, "event_location", locale)}</span>
                </span>
              )}
            </div>
          )}
        </Reveal>
      </Container>

      {post.cover_image && !embed && (
        <Container className="mt-10">
          <Reveal className="relative aspect-[16/9] overflow-hidden rounded-[var(--radius-tile)] bg-bg-muted">
            <AppImage src={post.cover_image} alt={title} seed={post.slug} priority sizes="(min-width: 1200px) 1180px, 100vw" />
          </Reveal>
        </Container>
      )}
      {embed && (
        <Container className="mt-10">
          <div className="relative aspect-video overflow-hidden rounded-[var(--radius-tile)] bg-black">
            <iframe
              src={embed}
              title={title}
              className="absolute inset-0 h-full w-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              loading="lazy"
            />
          </div>
        </Container>
      )}

      <Container size="narrow" className="py-12 sm:py-16">
        <Markdown className="text-[1.125rem] sm:text-[1.1875rem]">{tr(post, "body", locale)}</Markdown>
        <div className="mt-12 flex flex-wrap items-center gap-3 border-t border-line pt-8">
          {post.external_url && (
            <ButtonLink href={post.external_url} external variant="secondary">
              {t.news.readOriginal}
              <ArrowUpRight />
            </ButtonLink>
          )}
          <ShareButton url={url} title={title} labels={{ share: t.common.share, copied: t.common.copied }} />
        </div>
      </Container>

      {related.length > 0 && (
        <section className="bg-bg-subtle py-16 sm:py-20">
          <Container>
            <h2 className="text-title mb-10">{t.news.related}</h2>
            <div className="grid gap-x-6 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
              {related.map((p) => (
                <PostCard key={p.id} post={p} locale={locale} t={t} />
              ))}
            </div>
          </Container>
        </section>
      )}
    </article>
  );
}
