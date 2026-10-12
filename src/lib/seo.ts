import type { Metadata } from "next";
import { SITE_URL } from "@/lib/env";
import { locales, type Locale } from "@/lib/i18n/config";

/**
 * Per-page metadata with canonical URL, hreflang alternates for English and
 * Bangla, and Open Graph / Twitter cards.
 */
export function pageMetadata({
  locale,
  path,
  title,
  description,
  image,
  type = "website",
  noIndex,
}: {
  locale: Locale;
  path: string;
  title: string;
  description?: string | null;
  image?: string | null;
  type?: "website" | "article";
  noIndex?: boolean;
}): Metadata {
  const clean = path === "/" ? "" : path.startsWith("/") ? path : `/${path}`;
  const url = `${SITE_URL}/${locale}${clean}`;
  const languages = Object.fromEntries(locales.map((l) => [l === "bn" ? "bn-BD" : "en", `${SITE_URL}/${l}${clean}`]));
  const desc = description ?? undefined;
  return {
    title,
    description: desc,
    alternates: { canonical: url, languages: { ...languages, "x-default": `${SITE_URL}/en${clean}` } },
    openGraph: {
      type,
      url,
      title,
      description: desc,
      siteName: "BSBRA",
      locale: locale === "bn" ? "bn_BD" : "en_GB",
      ...(image ? { images: [{ url: image }] } : {}),
    },
    twitter: { card: "summary_large_image", title, description: desc, ...(image ? { images: [image] } : {}) },
    ...(noIndex ? { robots: { index: false, follow: false } } : {}),
  };
}
