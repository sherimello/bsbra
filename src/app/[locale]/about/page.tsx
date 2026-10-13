import type { Metadata } from "next";
import { getDictionary, href, resolveLocale } from "@/lib/i18n";
import { tr } from "@/lib/i18n/tr";
import { localizeDigits } from "@/lib/i18n/format";
import { pageMetadata } from "@/lib/seo";
import { getPagesWithPrefix } from "@/lib/data/public";
import { PHOTOS } from "@/lib/media/photos";
import { PhotoFigure } from "@/components/ui/photo-figure";
import { PageHero } from "@/components/site/page-hero";
import { Container } from "@/components/ui/container";
import { Markdown } from "@/components/ui/markdown";
import { ArrowLink, ButtonLink } from "@/components/ui/button";
import { Reveal } from "@/components/motion/reveal";

export async function generateMetadata({ params }: PageProps<"/[locale]/about">): Promise<Metadata> {
  const locale = await resolveLocale(params);
  const t = getDictionary(locale);
  return pageMetadata({ locale, path: "/about", title: t.nav.aboutOverview, description: t.about.lede });
}

export default async function AboutPage({ params }: PageProps<"/[locale]/about">) {
  const locale = await resolveLocale(params);
  const t = getDictionary(locale);
  const pages = await getPagesWithPrefix("about-");
  const mission = pages.find((p) => p.slug === "about-mission");
  const vision = pages.find((p) => p.slug === "about-vision");
  const sections = pages.filter((p) => p.slug !== "about-mission" && p.slug !== "about-vision");

  return (
    <>
      <PageHero eyebrow={t.about.eyebrow} title={t.about.title} lede={t.about.lede}>
        <PhotoFigure photo={PHOTOS.beachedBow} locale={locale} aspect="aspect-[4/3] sm:aspect-[21/9]" priority />
      </PageHero>

      {(mission || vision) && (
        <section className="pb-8 sm:pb-12">
          <Container>
            <div className="grid gap-5 lg:grid-cols-2">
              {[mission, vision].filter(Boolean).map((p, i) => (
                <Reveal key={p!.slug} delay={i * 0.06}>
                  <div className="h-full rounded-[var(--radius-tile)] bg-bg-subtle p-9 sm:p-12">
                    <p className="text-eyebrow mb-6 text-fg-subtle">
                      {i === 0 ? t.about.missionLabel : t.about.visionLabel}
                    </p>
                    <p className="text-[clamp(1.5rem,2.6vw,2.125rem)] leading-[1.22] font-semibold tracking-[-0.022em] text-balance">
                      {tr(p!, "summary", locale)}
                    </p>
                  </div>
                </Reveal>
              ))}
            </div>
          </Container>
        </section>
      )}

      <Container className="py-16 sm:py-24">
        <div className="divide-y divide-line">
          {sections.map((page, i) => (
            <section key={page.slug} id={page.slug.replace("about-", "")} className="grid gap-8 py-14 first:pt-0 lg:grid-cols-[5fr_7fr] lg:gap-16 sm:py-20">
              <Reveal className="lg:sticky lg:top-[calc(var(--header-h)+32px)] lg:self-start">
                <p className="mb-3 text-[0.8125rem] font-medium text-fg-faint tabular">
                  {localizeDigits(locale, String(i + 1).padStart(2, "0"))}
                </p>
                <h2 className="text-headline text-balance">{tr(page, "title", locale)}</h2>
                {page.summary_en && <p className="text-lede mt-5 text-fg-subtle">{tr(page, "summary", locale)}</p>}
              </Reveal>
              <Reveal delay={0.05}>
                <Markdown className="text-[1.0625rem] sm:text-[1.1875rem]">{tr(page, "body", locale)}</Markdown>
              </Reveal>
            </section>
          ))}
        </div>

        <Reveal className="mt-8 flex flex-wrap items-center gap-6 rounded-[var(--radius-tile)] bg-bg-subtle p-8 sm:p-10">
          <div className="flex-1">
            <h2 className="text-title">{t.nav.leadership}</h2>
            <p className="mt-2 text-fg-subtle">{t.nav.leadershipDesc}</p>
          </div>
          <div className="flex flex-wrap items-center gap-4">
            <ButtonLink href={href(locale, "/leadership")}>{t.about.leadershipCta}</ButtonLink>
            <ArrowLink href={href(locale, "/compliance")}>{t.nav.compliance}</ArrowLink>
          </div>
        </Reveal>
      </Container>
    </>
  );
}
