import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { Download, Ship } from "lucide-react";
import { getDictionary, href, resolveLocale, type Dictionary, type Locale } from "@/lib/i18n";
import { tr } from "@/lib/i18n/tr";
import { formatDate, formatNumber, localizeDigits } from "@/lib/i18n/format";
import { pageMetadata } from "@/lib/seo";
import { getVesselYears, getVessels, getYards } from "@/lib/data/public";
import type { VesselStatus, VesselType } from "@/lib/types";
import { PageHero } from "@/components/site/page-hero";
import { Container } from "@/components/ui/container";
import { FilterForm } from "@/components/site/filter-form";
import { TableShell, Td, Th, Tr } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { vesselStatusTone } from "@/lib/tones";
import { EmptyState } from "@/components/ui/empty-state";
import { Pagination, withParams } from "@/components/ui/pagination";
import { ButtonLink } from "@/components/ui/button";

export async function generateMetadata({ params }: PageProps<"/[locale]/vessels">): Promise<Metadata> {
  const locale = await resolveLocale(params);
  const t = getDictionary(locale);
  return pageMetadata({ locale, path: "/vessels", title: t.nav.vessels, description: t.vessels.lede });
}

const VESSEL_TYPES: VesselType[] = [
  "bulk_carrier", "oil_tanker", "chemical_tanker", "gas_carrier", "container", "general_cargo",
  "ro_ro", "passenger", "reefer", "offshore", "tug", "other",
];
const STATUSES: VesselStatus[] = ["anchored", "beached", "cutting", "completed"];

function param(value: string | string[] | undefined) {
  return (Array.isArray(value) ? value[0] : value)?.trim() ?? "";
}

export default async function VesselsPage({ params, searchParams }: PageProps<"/[locale]/vessels">) {
  const locale = await resolveLocale(params);
  const t = getDictionary(locale);
  return (
    <>
      <PageHero eyebrow={t.vessels.eyebrow} title={t.vessels.title} lede={t.vessels.lede} />
      <Container className="pb-24">
        <Suspense fallback={<ResultsSkeleton />}>
          <VesselResults locale={locale} t={t} searchParams={searchParams} />
        </Suspense>
      </Container>
    </>
  );
}

async function VesselResults({
  locale,
  t,
  searchParams,
}: {
  locale: Locale;
  t: Dictionary;
  searchParams: PageProps<"/[locale]/vessels">["searchParams"];
}) {
  const sp = await searchParams;
  const q = param(sp.q);
  const yard = param(sp.yard);
  const type = VESSEL_TYPES.includes(param(sp.type) as VesselType) ? (param(sp.type) as VesselType) : null;
  const status = STATUSES.includes(param(sp.status) as VesselStatus) ? (param(sp.status) as VesselStatus) : null;
  const year = /^\d{4}$/.test(param(sp.year)) ? Number(param(sp.year)) : null;
  const page = Math.max(1, Number(param(sp.page)) || 1);
  const pageSize = 25;

  const [yards, years, result] = await Promise.all([
    getYards(),
    getVesselYears(),
    getVessels({ q, yard: yard || null, type, status, year, page, pageSize }),
  ]);
  const yardName = new Map(yards.map((y) => [y.id, { name: tr(y, "name", locale), slug: y.slug }]));
  const v = t.vessels;
  const path = href(locale, "/vessels");
  const filters = { q, yard, type: type ?? "", status: status ?? "", year: year ?? "" };
  const exportHref = withParams("/api/reports/vessels", { ...filters, locale });

  return (
    <>
      <FilterForm
        action={path}
        search={{ name: "q", value: q, placeholder: v.searchPlaceholder }}
        labels={{ apply: t.common.apply, clear: t.common.clear, search: t.common.search }}
        selects={[
          { name: "yard", label: v.colYard, value: yard, options: [{ value: "", label: v.allYards }, ...yards.map((y) => ({ value: y.id, label: tr(y, "name", locale) }))] },
          { name: "type", label: v.colType, value: type ?? "", options: [{ value: "", label: v.allTypes }, ...VESSEL_TYPES.map((x) => ({ value: x, label: t.labels.vesselType[x] }))] },
          { name: "year", label: t.common.year, value: year ? String(year) : "", options: [{ value: "", label: v.allYears }, ...years.map((y) => ({ value: String(y), label: localizeDigits(locale, y) }))] },
          { name: "status", label: v.colStatus, value: status ?? "", options: [{ value: "", label: v.allStatuses }, ...STATUSES.map((x) => ({ value: x, label: t.labels.vesselStatus[x] }))] },
        ]}
      />

      <div className="mt-6 mb-4 flex flex-wrap items-center justify-between gap-3 text-[0.875rem] text-fg-subtle">
        <p className="tabular">
          {v.showing} <span className="font-semibold text-fg">{formatNumber(locale, result.count)}</span> {v.vesselsLabel} ·{" "}
          <span className="font-semibold text-fg">{formatNumber(locale, Math.round(result.totalLdt))}</span> {v.totalLdt}
        </p>
        <ButtonLink href={exportHref} variant="secondary" size="sm" prefetch={false}>
          <Download />
          {v.export}
        </ButtonLink>
      </div>

      {result.rows.length === 0 ? (
        <EmptyState icon={<Ship />} title={t.common.noResults} body={t.common.noResultsHint} />
      ) : (
        <TableShell>
          <thead>
            <tr>
              <Th>{v.colVessel}</Th>
              <Th>{v.colImo}</Th>
              <Th>{v.colType}</Th>
              <Th>{v.colFlag}</Th>
              <Th numeric>{v.colLdt}</Th>
              <Th>{v.colYard}</Th>
              <Th>{v.colBeached}</Th>
              <Th>{v.colStatus}</Th>
            </tr>
          </thead>
          <tbody>
            {result.rows.map((row) => {
              const y = row.yard_id ? yardName.get(row.yard_id) : undefined;
              return (
                <Tr key={row.id}>
                  <Td className="font-semibold text-fg">
                    <Link href={href(locale, `/vessels/${row.id}`)} className="hover:text-link hover:underline">
                      {row.vessel_name}
                    </Link>
                  </Td>
                  <Td className="tabular">{row.imo_number ?? "—"}</Td>
                  <Td>{t.labels.vesselType[row.vessel_type]}</Td>
                  <Td>{row.flag ?? "—"}</Td>
                  <Td numeric>{formatNumber(locale, row.ldt)}</Td>
                  <Td>
                    {y ? (
                      <Link href={href(locale, `/yards/${y.slug}`)} className="hover:text-link hover:underline">
                        {y.name}
                      </Link>
                    ) : (
                      "—"
                    )}
                  </Td>
                  <Td className="whitespace-nowrap tabular">{formatDate(locale, row.beaching_date, "medium") || "—"}</Td>
                  <Td>
                    <Badge tone={vesselStatusTone[row.status]} dot>
                      {t.labels.vesselStatus[row.status]}
                    </Badge>
                  </Td>
                </Tr>
              );
            })}
          </tbody>
        </TableShell>
      )}

      <Pagination
        path={path}
        params={filters}
        page={page}
        totalPages={Math.ceil(result.count / pageSize)}
        labels={{ previous: t.common.previous, next: t.common.next, page: t.common.page, of: t.common.of }}
      />
    </>
  );
}

function ResultsSkeleton() {
  return (
    <div aria-hidden className="space-y-3">
      <div className="skeleton h-[68px] rounded-[var(--radius-card)]" />
      <div className="skeleton mt-6 h-[480px] rounded-[var(--radius-card)]" />
    </div>
  );
}
