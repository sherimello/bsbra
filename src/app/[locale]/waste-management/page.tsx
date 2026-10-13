import type { Metadata } from "next";
import { getDictionary, resolveLocale } from "@/lib/i18n";
import { pageMetadata } from "@/lib/seo";
import { PHOTOS } from "@/lib/media/photos";
import { CmsPage } from "@/components/site/cms-page";

export async function generateMetadata({ params }: PageProps<"/[locale]/waste-management">): Promise<Metadata> {
  const locale = await resolveLocale(params);
  const t = getDictionary(locale);
  return pageMetadata({ locale, path: "/waste-management", title: t.nav.waste, description: t.nav.wasteDesc });
}

export default async function WasteManagementPage({ params }: PageProps<"/[locale]/waste-management">) {
  const locale = await resolveLocale(params);
  const t = getDictionary(locale);
  return <CmsPage slug="waste-management" locale={locale} eyebrow={t.nav.sustainability} photo={PHOTOS.yard} />;
}
