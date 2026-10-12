import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { MapPin, ShieldCheck } from "lucide-react";
import { getDictionary, href, resolveLocale, type Dictionary, type Locale } from "@/lib/i18n";
import { tr } from "@/lib/i18n/tr";
import { formatNumber } from "@/lib/i18n/format";
import { pageMetadata } from "@/lib/seo";
import { getYardSummaries, getYards } from "@/lib/data/public";
import type { YardStatus } from "@/lib/types";
import { yardStatusTone } from "@/lib/tones";
import { PageHero } from "@/components/site/page-hero";
import { Container } from "@/components/ui/container";
import { FilterPills } from "@/components/ui/filter-pills";
import { Badge } from "@/components/ui/badge";
import { AppImage } from "@/components/ui/app-image";
import { EmptyState } from "@/components/ui/empty-state";
import { RevealGroup, RevealItem } from "@/components/motion/reveal";

export async function generateMetadata({ params }: PageProps<"/[locale]/yards">): Promise<Metadata> {
  const locale = await resolveLocale(params);
  const t = getDictionary(locale);
  return pageMetadata({ locale, path: "/yards", title: t.nav.yards, description: t.yards.lede });
}

const FILTERS: (YardStatus | "all")[] = ["all", "green", "progressive", "conventional"];

export default async function YardsPage({ params, searchParams }: PageProps<"/[locale]/yards">) {
  const locale = await resolveLocale(params);
  const t = getDictionary(locale);
  return (
    <>
      <PageHero eyebrow={t.yards.eyebrow} title={t.yards.title} lede={t.yards.lede} />
      <Container className="pb-24">
        <Suspense fallback={<div className="skeleton h-[520px] rounded-[var(--radius-tile)]" />}>
          <YardGrid locale={locale} t={t} searchParams={searchParams} />
        </Suspense>
      </Container>
    </>
  );
}

async function YardGrid({
  locale,
  t,
  searchParams,
}: {
  locale: Locale;
  t: Dictionary;
  searchParams: PageProps<"/[locale]/yards">["searchParams"];
}) {
  const sp = await searchParams;
  const raw = Array.isArray(sp.status) ? sp.status[0] : sp.status;
  const status = FILTERS.includes(raw as YardStatus) ? (raw as YardStatus | "all") : "all";
  const [allYards, summaries] = await Promise.all([getYards(), getYardSummaries()]);
  const yards = status === "all" ? allYards.filter((y) => y.status !== "inactive") : allYards.filter((y) => y.status === status);
  const summary = new Map(summaries.map((s) => [s.yard_id, s]));
  const path = href(locale, "/yards");

  return (
    <>
      <FilterPills
        label={t.common.filter}
        className="mb-10"
        items={FILTERS.map((f) => ({
          label: f === "all" ? t.yards.filterAll : t.labels.yardStatus[f],
          href: f === "all" ? path : `${path}?status=${f}`,
          active: f === status,
          count: f === "all" ? allYards.filter((y) => y.status !== "inactive").length : allYards.filter((y) => y.status === f).length,
        }))}
      />
      {yards.length === 0 ? (
        <EmptyState title={t.common.noResults} />
      ) : (
        <RevealGroup className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {yards.map((yard) => {
            const s = summary.get(yard.id);
            const name = tr(yard, "name", locale);
            return (
              <RevealItem key={yard.id}>
                <Link
                  href={href(locale, `/yards/${yard.slug}`)}
                  className="group block overflow-hidden rounded-[var(--radius-tile)] bg-surface hairline transition-shadow duration-500 hover:shadow-[var(--shadow-md)]"
                >
                  <div className="relative aspect-[16/10] overflow-hidden bg-bg-muted">
                    <AppImage
                      src={yard.cover_image}
                      alt=""
                      seed={yard.slug}
                      className="transition-transform duration-[1.2s] ease-[var(--ease-out-quint)] group-hover:scale-[1.04]"
                    />
                  </div>
                  <div className="p-6">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge tone={yardStatusTone[yard.status]} dot>
                        {t.labels.yardStatus[yard.status]}
                      </Badge>
                      {yard.hkc_compliant && (
                        <Badge tone="brand">
                          <ShieldCheck className="size-3" />
                          {t.yards.hkc}
                        </Badge>
                      )}
                    </div>
                    <h2 className="mt-3 text-[1.375rem] leading-tight font-semibold tracking-[-0.022em] group-hover:text-link">{name}</h2>
                    {yard.address_en && (
                      <p className="mt-1.5 flex items-center gap-1.5 text-[0.875rem] text-fg-subtle">
                        <MapPin className="size-3.5" />
                        {tr(yard, "address", locale)}
                      </p>
                    )}
                    <dl className="mt-5 grid grid-cols-2 gap-4 border-t border-line pt-4 text-[0.8125rem]">
                      <div>
                        <dt className="text-fg-subtle">{t.yards.certifiedBy}</dt>
                        <dd className="mt-0.5 font-medium text-fg">{yard.certifying_body ?? "—"}</dd>
                      </div>
                      <div>
                        <dt className="text-fg-subtle">{t.yards.vesselsRecycled}</dt>
                        <dd className="mt-0.5 font-medium text-fg tabular">{formatNumber(locale, s?.vessels ?? 0)}</dd>
                      </div>
                    </dl>
                  </div>
                </Link>
              </RevealItem>
            );
          })}
        </RevealGroup>
      )}
    </>
  );
}
