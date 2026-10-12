import { notFound } from "next/navigation";
import { getDictionary, type Locale } from "@/lib/i18n";
import { tr } from "@/lib/i18n/tr";
import { getPage } from "@/lib/data/public";
import { PageHero } from "./page-hero";
import { CmsSections } from "./cms-sections";

/** A complete page rendered from one CMS record: hero from title/summary, sections from the body. */
export async function CmsPage({ slug, locale, eyebrow, children }: { slug: string; locale: Locale; eyebrow?: string; children?: React.ReactNode }) {
  const page = await getPage(slug);
  if (!page) notFound();
  const t = getDictionary(locale);
  return (
    <>
      <PageHero eyebrow={eyebrow} title={tr(page, "title", locale)} lede={tr(page, "summary", locale)} />
      {children}
      <CmsSections body={tr(page, "body", locale)} locale={locale} className="pt-0 sm:pt-4" onThisPage={t.common.onThisPage} />
    </>
  );
}
