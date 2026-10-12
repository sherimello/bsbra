import type { Metadata } from "next";
import { Suspense } from "react";
import { getDictionary, href, resolveLocale } from "@/lib/i18n";
import { tr } from "@/lib/i18n/tr";
import { pageMetadata } from "@/lib/seo";
import { POST_GROUPS, getPage } from "@/lib/data/public";
import { PageHero } from "@/components/site/page-hero";
import { Container } from "@/components/ui/container";
import { FeedSkeleton, PostFeed } from "@/components/site/post-feed";

export async function generateMetadata({ params }: PageProps<"/[locale]/csr">): Promise<Metadata> {
  const locale = await resolveLocale(params);
  const t = getDictionary(locale);
  return pageMetadata({ locale, path: "/csr", title: t.nav.csr, description: t.csr.lede });
}

export default async function CsrPage({ params, searchParams }: PageProps<"/[locale]/csr">) {
  const locale = await resolveLocale(params);
  const t = getDictionary(locale);
  const page = await getPage("csr");
  return (
    <>
      <PageHero eyebrow={t.csr.eyebrow} title={t.csr.title} lede={page ? tr(page, "summary", locale) : t.csr.lede} />
      <Container className="pb-24">
        <Suspense fallback={<FeedSkeleton />}>
          <PostFeed
            locale={locale}
            t={t}
            path={href(locale, "/csr")}
            types={POST_GROUPS.csr}
            searchParams={searchParams}
            filter="csr"
            emptyText={t.csr.empty}
          />
        </Suspense>
      </Container>
    </>
  );
}
