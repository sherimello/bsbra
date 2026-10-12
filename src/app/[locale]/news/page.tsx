import type { Metadata } from "next";
import { Suspense } from "react";
import { getDictionary, href, resolveLocale } from "@/lib/i18n";
import { pageMetadata } from "@/lib/seo";
import { POST_GROUPS, getUpcomingEvents } from "@/lib/data/public";
import { PageHero } from "@/components/site/page-hero";
import { Container } from "@/components/ui/container";
import { PostCard } from "@/components/site/post-card";
import { FeedSkeleton, PostFeed } from "@/components/site/post-feed";
import { Reveal } from "@/components/motion/reveal";

export async function generateMetadata({ params }: PageProps<"/[locale]/news">): Promise<Metadata> {
  const locale = await resolveLocale(params);
  const t = getDictionary(locale);
  return pageMetadata({ locale, path: "/news", title: t.nav.news, description: t.news.lede });
}

export default async function NewsPage({ params, searchParams }: PageProps<"/[locale]/news">) {
  const locale = await resolveLocale(params);
  const t = getDictionary(locale);
  const upcoming = await getUpcomingEvents(3);

  return (
    <>
      <PageHero eyebrow={t.news.eyebrow} title={t.news.title} lede={t.news.lede} />
      {upcoming.length > 0 && (
        <Container className="pb-12">
          <Reveal className="rounded-[var(--radius-tile)] bg-bg-subtle p-6 sm:p-8">
            <h2 className="text-[0.9375rem] font-semibold text-fg-subtle">{t.news.upcoming}</h2>
            <div className="mt-2 grid gap-x-8 md:grid-cols-3">
              {upcoming.map((post) => (
                <PostCard key={post.id} post={post} locale={locale} t={t} variant="compact" />
              ))}
            </div>
          </Reveal>
        </Container>
      )}
      <Container className="pb-24">
        <Suspense fallback={<FeedSkeleton />}>
          <PostFeed
            locale={locale}
            t={t}
            path={href(locale, "/news")}
            types={POST_GROUPS.newsroom}
            searchParams={searchParams}
            emptyText={t.news.empty}
          />
        </Suspense>
      </Container>
    </>
  );
}
