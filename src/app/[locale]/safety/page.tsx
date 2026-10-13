import type { Metadata } from "next";
import { getDictionary, resolveLocale } from "@/lib/i18n";
import { pageMetadata } from "@/lib/seo";
import { PHOTOS } from "@/lib/media/photos";
import { CmsPage } from "@/components/site/cms-page";

export async function generateMetadata({ params }: PageProps<"/[locale]/safety">): Promise<Metadata> {
  const locale = await resolveLocale(params);
  const t = getDictionary(locale);
  return pageMetadata({ locale, path: "/safety", title: t.nav.safety, description: t.nav.safetyDesc });
}

export default async function SafetyPage({ params }: PageProps<"/[locale]/safety">) {
  const locale = await resolveLocale(params);
  const t = getDictionary(locale);
  return <CmsPage slug="safety" locale={locale} eyebrow={t.nav.sustainability} photo={PHOTOS.ksrmVisit} />;
}
