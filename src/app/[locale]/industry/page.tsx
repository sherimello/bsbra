import type { Metadata } from "next";
import { Download } from "lucide-react";
import { getDictionary, href, resolveLocale } from "@/lib/i18n";
import { formatNumber, localizeDigits } from "@/lib/i18n/format";
import { tr } from "@/lib/i18n/tr";
import { pageMetadata } from "@/lib/seo";
import { getIndustryStatistics, getVesselTypeSummary } from "@/lib/data/public";
import { PageHero } from "@/components/site/page-hero";
import { Container } from "@/components/ui/container";
import { StatTile } from "@/components/ui/stat-tile";
import { TableShell, Td, Th, Tr } from "@/components/ui/table";
import { ArrowLink, ButtonLink } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Reveal, RevealGroup, RevealItem } from "@/components/motion/reveal";
import { ColumnChart } from "@/components/charts/column-chart";
import { LineChart } from "@/components/charts/line-chart";
import { HBarChart } from "@/components/charts/hbar-chart";

export async function generateMetadata({ params }: PageProps<"/[locale]/industry">): Promise<Metadata> {
  const locale = await resolveLocale(params);
  const t = getDictionary(locale);
  return pageMetadata({ locale, path: "/industry", title: t.nav.statistics, description: t.industry.lede });
}

function ChartCard({ title, note, children }: { title: string; note?: string; children: React.ReactNode }) {
  return (
    <div className="rounded-[var(--radius-tile)] bg-surface p-6 hairline sm:p-8">
      <h3 className="text-[1.0625rem] font-semibold tracking-[-0.015em]">{title}</h3>
      {note && <p className="mt-1 text-[0.8125rem] text-fg-subtle">{note}</p>}
      <div className="mt-6">{children}</div>
    </div>
  );
}

export default async function IndustryPage({ params }: PageProps<"/[locale]/industry">) {
  const locale = await resolveLocale(params);
  const t = getDictionary(locale);
  const s = t.industry;
  const [stats, mix] = await Promise.all([getIndustryStatistics(), getVesselTypeSummary()]);
  const latest = stats.at(-1);
  const previous = stats.at(-2);
  const totalMix = mix.reduce((a, m) => a + m.vessels, 0);
  const vsLabel = previous ? `${s.vsPrevious} (${localizeDigits(locale, previous.year)})` : undefined;

  return (
    <>
      <PageHero eyebrow={s.eyebrow} title={s.title} lede={s.lede}>
        <div className="flex flex-wrap items-center gap-4">
          <ButtonLink href={`/api/reports/statistics?locale=${locale}`} variant="secondary" prefetch={false}>
            <Download />
            {s.download}
          </ButtonLink>
          <ArrowLink href={href(locale, "/vessels")}>{t.nav.vessels}</ArrowLink>
        </div>
      </PageHero>

      {!latest ? (
        <Container className="pb-24">
          <EmptyState title={t.common.comingSoon} />
        </Container>
      ) : (
        <>
          <Container className="pb-6">
            <p className="mb-4 text-[0.875rem] font-medium text-fg-subtle">
              {t.home.statsYearNote} {localizeDigits(locale, latest.year)}
            </p>
            <RevealGroup className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6">
              {[
                { label: s.kpiVessels, value: latest.vessels_recycled, prev: previous?.vessels_recycled },
                { label: s.kpiBeached, value: latest.vessels_beached, prev: previous?.vessels_beached },
                { label: s.kpiLdt, value: latest.total_ldt, prev: previous?.total_ldt, compact: true },
                { label: s.kpiYards, value: latest.active_yards, prev: previous?.active_yards },
                { label: s.kpiGreen, value: latest.green_yards, prev: previous?.green_yards },
                { label: s.kpiShare, value: latest.global_share_percent, prev: previous?.global_share_percent, suffix: "%" },
              ].map((k) => (
                <RevealItem key={k.label}>
                  <StatTile
                    label={k.label}
                    value={k.value}
                    previous={k.prev}
                    locale={locale}
                    compact={k.compact}
                    suffix={k.suffix}
                    deltaLabel={vsLabel ? "" : undefined}
                    className="h-full"
                  />
                </RevealItem>
              ))}
            </RevealGroup>
            {vsLabel && <p className="mt-3 text-[0.8125rem] text-fg-faint">{vsLabel}</p>}
          </Container>

          <Container className="grid gap-4 py-10 lg:grid-cols-2">
            <Reveal>
              <ChartCard title={s.chartVessels}>
                <ColumnChart
                  locale={locale}
                  ariaLabel={s.chartVessels}
                  series={[{ key: "v", label: s.colVessels, color: "var(--chart-1)" }]}
                  data={stats.map((r) => ({ label: r.year, values: { v: r.vessels_recycled } }))}
                />
              </ChartCard>
            </Reveal>
            <Reveal delay={0.05}>
              <ChartCard title={s.chartLdt}>
                <LineChart
                  locale={locale}
                  ariaLabel={s.chartLdt}
                  format="compact"
                  series={[{ key: "ldt", label: s.colLdt, color: "var(--chart-2)" }]}
                  data={stats.map((r) => ({ label: r.year, values: { ldt: r.total_ldt } }))}
                />
              </ChartCard>
            </Reveal>
            <Reveal>
              <ChartCard title={s.chartYards}>
                <LineChart
                  locale={locale}
                  ariaLabel={s.chartYards}
                  series={[
                    { key: "active", label: s.colYards, color: "var(--chart-1)" },
                    { key: "green", label: s.colGreen, color: "var(--chart-2)" },
                  ]}
                  data={stats.map((r) => ({ label: r.year, values: { active: r.active_yards, green: r.green_yards } }))}
                />
              </ChartCard>
            </Reveal>
            <Reveal delay={0.05}>
              <ChartCard title={s.chartMix} note={s.chartMixNote}>
                <HBarChart
                  locale={locale}
                  ariaLabel={s.chartMix}
                  total={totalMix}
                  items={mix.slice(0, 7).map((m) => ({ label: t.labels.vesselType[m.vessel_type], value: m.vessels }))}
                />
              </ChartCard>
            </Reveal>
          </Container>

          <Container className="pt-6 pb-24">
            <Reveal className="mb-6 flex flex-wrap items-end justify-between gap-4">
              <h2 className="text-title">{s.tableTitle}</h2>
              <p className="text-[0.8125rem] text-fg-subtle">{s.sourceNote}</p>
            </Reveal>
            <Reveal>
              <TableShell>
                <thead>
                  <tr>
                    <Th>{s.colYear}</Th>
                    <Th numeric>{s.colVessels}</Th>
                    <Th numeric>{s.colBeached}</Th>
                    <Th numeric>{s.colLdt}</Th>
                    <Th numeric>{s.colYards}</Th>
                    <Th numeric>{s.colGreen}</Th>
                    <Th numeric>{s.colWorkers}</Th>
                    <Th numeric>{s.colShare}</Th>
                  </tr>
                </thead>
                <tbody>
                  {[...stats].reverse().map((r) => (
                    <Tr key={r.id}>
                      <Td className="font-semibold text-fg tabular">
                        {localizeDigits(locale, r.year)}
                        {r.notes_en && <span className="mt-0.5 block text-[0.75rem] font-normal text-fg-subtle">{tr(r, "notes", locale)}</span>}
                      </Td>
                      <Td numeric>{formatNumber(locale, r.vessels_recycled)}</Td>
                      <Td numeric>{formatNumber(locale, r.vessels_beached)}</Td>
                      <Td numeric>{formatNumber(locale, r.total_ldt)}</Td>
                      <Td numeric>{formatNumber(locale, r.active_yards)}</Td>
                      <Td numeric>{formatNumber(locale, r.green_yards)}</Td>
                      <Td numeric>{formatNumber(locale, r.workers_employed)}</Td>
                      <Td numeric>{r.global_share_percent === null ? "—" : `${formatNumber(locale, r.global_share_percent)}%`}</Td>
                    </Tr>
                  ))}
                </tbody>
              </TableShell>
            </Reveal>
          </Container>
        </>
      )}
    </>
  );
}
