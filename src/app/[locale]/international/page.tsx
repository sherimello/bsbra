import type { Metadata } from "next";
import { Suspense } from "react";
import { getDictionary, href, resolveLocale } from "@/lib/i18n";
import { tr } from "@/lib/i18n/tr";
import { pageMetadata } from "@/lib/seo";
import { POST_GROUPS, getPage } from "@/lib/data/public";
import { PageHero } from "@/components/site/page-hero";
import { Container } from "@/components/ui/container";
import { FeedSkeleton, PostFeed } from "@/components/site/post-feed";

export async function generateMetadata({ params }: PageProps<"/[locale]/international">): Promise<Metadata> {
  const locale = await resolveLocale(params);
  const t = getDictionary(locale);
  return pageMetadata({ locale, path: "/international", title: t.nav.international, description: t.international.lede });
}

export default async function InternationalPage({ params, searchParams }: PageProps<"/[locale]/international">) {
  const locale = await resolveLocale(params);
  const t = getDictionary(locale);
  const page = await getPage("international");
  return (
    <>
      <PageHero
        eyebrow={t.international.eyebrow}
        title={t.international.title}
        lede={page ? tr(page, "summary", locale) : t.international.lede}
      />
      <Container className="py-16 sm:py-24">
        <Suspense fallback={<FeedSkeleton />}>
          <PostFeed
            locale={locale}
            t={t}
            path={href(locale, "/international")}
            types={POST_GROUPS.international}
            searchParams={searchParams}
            filter="none"
            emptyText={t.international.empty}
          />
        </Suspense>
      </Container>
    </>
  );
}
