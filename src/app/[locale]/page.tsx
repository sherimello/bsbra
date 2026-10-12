import type { Metadata } from "next";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { getDictionary, href, isLocale, type Locale } from "@/lib/i18n";
import { tr } from "@/lib/i18n/tr";
import { formatCompact, localizeDigits } from "@/lib/i18n/format";
import { mediaUrl } from "@/lib/env";
import { pageMetadata } from "@/lib/seo";
import { POST_GROUPS, getIndustryStatistics, getLatestPosts, getSiteSettings, getYards } from "@/lib/data/public";
import { Container } from "@/components/ui/container";
import { Section, SectionHeading } from "@/components/ui/section";
import { ArrowLink, ButtonLink } from "@/components/ui/button";
import { Reveal, RevealGroup, RevealItem } from "@/components/motion/reveal";
import { CountUp } from "@/components/motion/count-up";
import { HomeHero } from "@/components/home/home-hero";
import { ScrollStatement } from "@/components/home/scroll-statement";
import { YardShowcase } from "@/components/home/yard-showcase";
import { PostCard } from "@/components/site/post-card";

export async function generateMetadata({ params }: PageProps<"/[locale]">): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const t = getDictionary(locale);
  return {
    ...pageMetadata({ locale, path: "/", title: t.meta.siteName, description: t.meta.description }),
    title: { absolute: `${t.meta.siteName} — ${t.meta.tagline}` },
  };
}

export default async function HomePage({ params }: PageProps<"/[locale]">) {
  const { locale: param } = await params;
  const locale = (isLocale(param) ? param : "en") as Locale;
  const t = getDictionary(locale);
  const h = t.home;

  const [settings, stats, yards, news] = await Promise.all([
    getSiteSettings(),
    getIndustryStatistics(),
    getYards(["green", "progressive"]),
    getLatestPosts(POST_GROUPS.newsroom, 3),
  ]);
  const latest = stats.at(-1);
  const totalVessels = stats.reduce((sum, s) => sum + (s.vessels_recycled ?? 0), 0);

  const explore = [
    { title: t.nav.statistics, body: t.nav.statisticsDesc, href: "/industry" },
    { title: t.nav.vessels, body: t.nav.vesselsDesc, href: "/vessels" },
    { title: t.nav.yards, body: t.nav.yardsDesc, href: "/yards" },
    { title: t.nav.tides, body: t.nav.tidesDesc, href: "/tides" },
    { title: t.nav.compliance, body: t.nav.complianceDesc, href: "/compliance" },
    { title: t.nav.safety, body: t.nav.safetyDesc, href: "/safety" },
    { title: t.nav.publications, body: t.nav.publicationsDesc, href: "/publications" },
    { title: t.nav.gallery, body: t.nav.galleryDesc, href: "/gallery" },
  ];

  const announcement = tr(settings, "announcement", locale);

  return (
    <>
      {announcement && (
        <div className="bg-bg-subtle">
          <Container className="py-3 text-center text-[0.875rem] text-fg-muted">
            {announcement}{" "}
            {settings.announcement_url && (
              <ArrowLink href={href(locale, settings.announcement_url)} className="ml-1">
                {t.common.learnMore}
              </ArrowLink>
            )}
          </Container>
        </div>
      )}

      <HomeHero
        eyebrow={h.heroEyebrow}
        titleA={h.heroTitleA}
        titleB={h.heroTitleB}
        lede={h.heroLede}
        primary={{ label: h.heroPrimary, href: href(locale, "/industry") }}
        secondary={{ label: h.heroSecondary, href: href(locale, "/yards") }}
        art="/art/bathymetry.svg"
        caption={{ place: h.heroPlace, coords: "22°26′ N · 91°43′ E" }}
      />

      {/* Why it matters — a statement that lights up as it scrolls by */}
      <Section>
        <Reveal>
          <p className="text-eyebrow mb-6 text-fg-subtle">{h.storyEyebrow}</p>
        </Reveal>
        <ScrollStatement
          text={`${h.storyTitle} ${h.storyLede}`}
          className="max-w-5xl text-[clamp(1.875rem,3.7vw,3.25rem)] leading-[1.14] font-semibold tracking-[-0.026em] text-fg [&:lang(bn)]:leading-[1.4] [&:lang(bn)]:tracking-normal"
        />
        <RevealGroup className="mt-20 grid gap-x-10 gap-y-12 border-t border-line pt-10 sm:mt-28 md:grid-cols-3">
          {h.storyPoints.map((point, i) => (
            <RevealItem key={point.title}>
              <p className="text-[0.8125rem] font-medium text-fg-faint tabular">{localizeDigits(locale, `0${i + 1}`)}</p>
              <h3 className="mt-3 text-[1.25rem] leading-snug font-semibold tracking-[-0.02em]">{point.title}</h3>
              <p className="mt-2.5 leading-relaxed text-fg-subtle">{point.body}</p>
            </RevealItem>
          ))}
        </RevealGroup>
      </Section>

      {/* At a glance */}
      {latest && (
        <Section tone="subtle" id="overview">
          <SectionHeading
            eyebrow={h.statsEyebrow}
            title={h.statsTitle}
            lede={h.statsLede}
            action={<ArrowLink href={href(locale, "/industry")}>{t.common.learnMore}</ArrowLink>}
          />
          <RevealGroup className="grid grid-cols-2 gap-x-8 gap-y-12 lg:grid-cols-4">
            {[
              { label: h.statVessels, value: latest.vessels_recycled ?? 0, compact: false },
              { label: h.statLdt, value: latest.total_ldt ?? 0, compact: true },
              { label: h.statYards, value: latest.active_yards ?? 0, compact: false },
              { label: h.statGreen, value: latest.green_yards ?? 0, compact: false },
            ].map((s) => (
              <RevealItem key={s.label} className="border-t border-line-strong pt-6">
                <p className="text-[clamp(2.75rem,5.4vw,4.75rem)] leading-none font-semibold tracking-[-0.04em] tabular text-fg">
                  <CountUp value={s.value} locale={locale} compact={s.compact} />
                </p>
                <p className="mt-4 text-[0.9375rem] text-fg-subtle">{s.label}</p>
              </RevealItem>
            ))}
          </RevealGroup>
          <Reveal className="mt-14 text-[0.8125rem] text-fg-faint">
            {h.statsYearNote} {localizeDigits(locale, latest.year)} · {formatCompact(locale, totalVessels)}{" "}
            {t.industry.vessels}, {localizeDigits(locale, stats[0]?.year ?? "")}–{localizeDigits(locale, latest.year)}
          </Reveal>
        </Section>
      )}

      {/* Green yards */}
      {yards.length > 0 && (
        <Section className="overflow-hidden">
          <SectionHeading
            eyebrow={h.greenEyebrow}
            title={h.greenTitle}
            lede={h.greenLede}
            action={<ArrowLink href={href(locale, "/yards")}>{h.greenCta}</ArrowLink>}
          />
          <Reveal>
            <YardShowcase
              yards={yards.map((y) => ({
                slug: y.slug,
                href: href(locale, `/yards/${y.slug}`),
                name: tr(y, "name", locale),
                status: y.status,
                statusLabel: t.labels.yardStatus[y.status],
                certifier: y.certifying_body,
                image: mediaUrl(y.cover_image),
                location: tr(y, "address", locale).split(",")[0] ?? "",
              }))}
              labels={{ previous: t.common.previous, next: t.common.next, certifiedBy: t.yards.certifiedBy }}
            />
          </Reveal>
        </Section>
      )}

      {/* Newsroom */}
      {news.length > 0 && (
        <Section tone="subtle">
          <SectionHeading
            eyebrow={h.newsEyebrow}
            title={h.newsTitle}
            action={<ArrowLink href={href(locale, "/news")}>{h.newsCta}</ArrowLink>}
          />
          <div className="grid gap-x-10 gap-y-14 lg:grid-cols-[7fr_5fr]">
            <Reveal>
              <PostCard post={news[0]} locale={locale} t={t} variant="feature" />
            </Reveal>
            <div className="grid content-start gap-10">
              {news.slice(1).map((post, i) => (
                <Reveal key={post.id} delay={0.06 * (i + 1)}>
                  <PostCard post={post} locale={locale} t={t} variant="row" />
                </Reveal>
              ))}
            </div>
          </div>
        </Section>
      )}

      {/* Explore — an index of the platform */}
      <Section>
        <SectionHeading eyebrow={h.exploreEyebrow} title={h.exploreTitle} />
        <RevealGroup as="ul" className="grid border-b border-line md:grid-cols-2 md:gap-x-12">
          {explore.map(({ title, body, href: path }) => (
            <RevealItem as="li" key={path} className="border-t border-line">
              <Link href={href(locale, path)} className="group flex items-start justify-between gap-6 py-7">
                <span>
                  <span className="block text-[1.375rem] leading-tight font-semibold tracking-[-0.024em] text-fg">
                    {title}
                  </span>
                  <span className="mt-1.5 block max-w-md text-[0.9375rem] text-fg-subtle">{body}</span>
                </span>
                <span className="mt-0.5 grid size-9 shrink-0 place-items-center rounded-full bg-bg-subtle text-fg-muted transition-colors duration-300 group-hover:bg-fg group-hover:text-bg">
                  <ArrowUpRight className="size-4 transition-transform duration-300 group-hover:translate-x-px group-hover:-translate-y-px" />
                </span>
              </Link>
            </RevealItem>
          ))}
        </RevealGroup>
      </Section>

      {/* Regulator & portal */}
      <Section className="pt-0 sm:pt-0">
        <div className="grid gap-5 lg:grid-cols-2">
          <Reveal>
            <div className="flex h-full min-h-[22rem] flex-col justify-between rounded-[var(--radius-tile)] bg-ink p-9 text-ink-fg sm:p-12">
              <div>
                <p className="text-eyebrow mb-4 text-ink-muted">{h.bsrbEyebrow}</p>
                <h2 className="text-title max-w-md text-balance">{h.bsrbTitle}</h2>
                <p className="mt-4 max-w-md text-ink-muted">{h.bsrbBody}</p>
              </div>
              {settings.bsrb_url && (
                <div className="mt-10">
                  <ButtonLink href={settings.bsrb_url} external variant="inverse">
                    {h.bsrbCta}
                    <ArrowUpRight />
                  </ButtonLink>
                </div>
              )}
            </div>
          </Reveal>
          <Reveal delay={0.06}>
            <div className="flex h-full min-h-[22rem] flex-col justify-between rounded-[var(--radius-tile)] bg-bg-subtle p-9 sm:p-12">
              <div>
                <p className="text-eyebrow mb-4 text-fg-subtle">{t.nav.portal}</p>
                <h2 className="text-title max-w-md text-balance">{h.portalTitle}</h2>
                <p className="mt-4 max-w-md text-fg-subtle">{h.portalBody}</p>
              </div>
              <div className="mt-10">
                <ButtonLink href={href(locale, "/login")}>{h.portalCta}</ButtonLink>
              </div>
            </div>
          </Reveal>
        </div>
      </Section>
    </>
  );
}
