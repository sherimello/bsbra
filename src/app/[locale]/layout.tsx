import "../globals.css";
import type { Metadata, Viewport } from "next";
import { Suspense, ViewTransition } from "react";
import { notFound } from "next/navigation";
import { Toaster } from "sonner";
import { getDictionary, href, isLocale, locales, type Locale } from "@/lib/i18n";
import { GOOGLE_SITE_VERIFICATION, SITE_URL } from "@/lib/env";
import { buildNavigation } from "@/lib/navigation";
import { getSiteSettings } from "@/lib/data/public";
import { MotionProvider } from "@/components/motion/motion-provider";
import { SiteHeader } from "@/components/site/site-header";
import { SiteFooter } from "@/components/site/site-footer";
import { HeaderAccount, SignInIcon } from "@/components/site/header-account";
import { Analytics } from "@/components/site/analytics";
import { ThemeScript } from "@/components/theme/theme-script";
import { RevealController } from "@/components/motion/reveal-controller";
import { fontVariables } from "../fonts";

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export const viewport: Viewport = {
  themeColor: "#ffffff",
  width: "device-width",
  initialScale: 1,
};

export async function generateMetadata({ params }: LayoutProps<"/[locale]">): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const t = getDictionary(locale);
  return {
    metadataBase: new URL(SITE_URL),
    title: { default: `${t.meta.siteName} — ${t.meta.tagline}`, template: `%s · ${t.meta.siteShort}` },
    description: t.meta.description,
    applicationName: "BSBRA",
    formatDetection: { telephone: false },
    ...(GOOGLE_SITE_VERIFICATION ? { verification: { google: GOOGLE_SITE_VERIFICATION } } : {}),
  };
}

export default async function LocaleLayout({ children, params }: LayoutProps<"/[locale]">) {
  const { locale: param } = await params;
  if (!isLocale(param)) notFound();
  const locale: Locale = param;
  const t = getDictionary(locale);
  const settings = await getSiteSettings();
  const groups = buildNavigation(locale, t);

  return (
    // data-theme is set before paint by ThemeScript when the visitor chose dark.
    <html lang={locale} className={fontVariables} suppressHydrationWarning>
      <body className="min-h-dvh">
        <ThemeScript />
        <MotionProvider>
          <SiteHeader
            locale={locale}
            groups={groups}
            labels={{
              home: t.meta.siteShort,
              menu: t.nav.menu,
              close: t.nav.close,
              search: t.nav.search,
              language: t.nav.language,
              skipToContent: t.nav.skipToContent,
              siteName: t.meta.siteName,
              themeLight: t.nav.themeLight,
              themeDark: t.nav.themeDark,
              appearance: t.nav.appearance,
            }}
            searchLabels={{
              placeholder: t.search.placeholder,
              hint: t.search.hint,
              shortcut: t.search.shortcut,
              quickLinks: t.portal.quickLinks,
              close: t.nav.close,
            }}
            quickLinks={[
              { label: t.nav.vessels, href: href(locale, "/vessels") },
              { label: t.nav.yards, href: href(locale, "/yards") },
              { label: t.nav.statistics, href: href(locale, "/industry") },
              { label: t.nav.publications, href: href(locale, "/publications") },
              { label: t.nav.tides, href: href(locale, "/tides") },
            ]}
            account={
              <Suspense fallback={<SignInIcon locale={locale} label={t.nav.signIn} />}>
                <HeaderAccount locale={locale} signInLabel={t.nav.signIn} portalLabel={t.nav.portal} />
              </Suspense>
            }
          />
          <main id="main">
            <ViewTransition default="page">{children}</ViewTransition>
          </main>
          <SiteFooter locale={locale} t={t} groups={groups} settings={settings} />
        </MotionProvider>
        <Toaster position="bottom-center" toastOptions={{ className: "!rounded-2xl" }} />
        <Analytics />
        <RevealController />
      </body>
    </html>
  );
}
