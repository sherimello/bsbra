import type { Metadata } from "next";
import { getDictionary, resolveLocale } from "@/lib/i18n";
import { tr } from "@/lib/i18n/tr";
import { formatNumber, localizeDigits } from "@/lib/i18n/format";
import { pageMetadata } from "@/lib/seo";
import { getLabourStatistics, getPage } from "@/lib/data/public";
import { PageHero } from "@/components/site/page-hero";
import { CmsSections } from "@/components/site/cms-sections";
import { Container } from "@/components/ui/container";
import { StatTile } from "@/components/ui/stat-tile";
import { TableShell, Td, Th, Tr } from "@/components/ui/table";
import { Reveal, RevealGroup, RevealItem } from "@/components/motion/reveal";
import { ColumnChart } from "@/components/charts/column-chart";

export async function generateMetadata({ params }: PageProps<"/[locale]/labour">): Promise<Metadata> {
  const locale = await resolveLocale(params);
  const t = getDictionary(locale);
  return pageMetadata({ locale, path: "/labour", title: t.nav.labour, description: t.labour.lede });
}

export default async function LabourPage({ params }: PageProps<"/[locale]/labour">) {
  const locale = await resolveLocale(params);
  const t = getDictionary(locale);
  const l = t.labour;
  const [stats, page] = await Promise.all([getLabourStatistics(), getPage("labour")]);
  const latest = stats.at(-1);
  const previous = stats.at(-2);

  return (
    <>
      <PageHero eyebrow={l.eyebrow} title={l.title} lede={page ? tr(page, "summary", locale) : l.lede} />

      {latest && (
        <Container className="pb-8">
          <p className="mb-4 text-[0.875rem] font-medium text-fg-subtle">
            {t.home.statsYearNote} {localizeDigits(locale, latest.year)}
          </p>
          <RevealGroup className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6">
            {[
              { label: l.kpiWorkers, value: latest.workers_employed, prev: previous?.workers_employed },
              { label: l.kpiTrained, value: latest.workers_trained, prev: previous?.workers_trained },
              { label: l.kpiSessions, value: latest.training_sessions, prev: previous?.training_sessions },
              { label: l.kpiHealth, value: latest.health_checkups, prev: previous?.health_checkups },
              { label: l.kpiInsured, value: latest.insured_workers, prev: previous?.insured_workers },
              { label: l.kpiWelfare, value: latest.welfare_programmes, prev: previous?.welfare_programmes },
            ].map((k) => (
              <RevealItem key={k.label}>
                <StatTile label={k.label} value={k.value} previous={k.prev} locale={locale} className="h-full" />
              </RevealItem>
            ))}
          </RevealGroup>

          <Reveal className="mt-4">
            <div className="rounded-[var(--radius-tile)] bg-surface p-6 hairline sm:p-8">
              <h2 className="text-[1.0625rem] font-semibold tracking-[-0.015em]">{l.kpiTrained}</h2>
              <div className="mt-6">
                <ColumnChart
                  locale={locale}
                  ariaLabel={l.kpiTrained}
                  series={[{ key: "trained", label: l.kpiTrained, color: "var(--chart-1)" }]}
                  data={stats.map((s) => ({ label: s.year, values: { trained: s.workers_trained } }))}
                />
              </div>
            </div>
          </Reveal>
        </Container>
      )}

      {page && <CmsSections body={tr(page, "body", locale)} locale={locale} />}

      {stats.length > 0 && (
        <Container className="pb-24">
          <Reveal>
            <h2 className="text-title mb-6">{l.tableTitle}</h2>
            <TableShell>
              <thead>
                <tr>
                  <Th>{t.common.year}</Th>
                  <Th numeric>{l.kpiWorkers}</Th>
                  <Th numeric>{l.kpiTrained}</Th>
                  <Th numeric>{l.kpiSessions}</Th>
                  <Th numeric>{l.kpiHealth}</Th>
                  <Th numeric>{l.kpiInsured}</Th>
                  <Th numeric>{l.kpiWelfare}</Th>
                </tr>
              </thead>
              <tbody>
                {[...stats].reverse().map((s) => (
                  <Tr key={s.id}>
                    <Td className="font-semibold text-fg tabular">{localizeDigits(locale, s.year)}</Td>
                    <Td numeric>{formatNumber(locale, s.workers_employed)}</Td>
                    <Td numeric>{formatNumber(locale, s.workers_trained)}</Td>
                    <Td numeric>{formatNumber(locale, s.training_sessions)}</Td>
                    <Td numeric>{formatNumber(locale, s.health_checkups)}</Td>
                    <Td numeric>{formatNumber(locale, s.insured_workers)}</Td>
                    <Td numeric>{formatNumber(locale, s.welfare_programmes)}</Td>
                  </Tr>
                ))}
              </tbody>
            </TableShell>
          </Reveal>
        </Container>
      )}
    </>
  );
}
