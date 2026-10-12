import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { notFound } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { getDictionary, href, isLocale } from "@/lib/i18n";
import { tr } from "@/lib/i18n/tr";
import { formatDate, formatNumber, localizeDigits } from "@/lib/i18n/format";
import { pageMetadata } from "@/lib/seo";
import { getStaticIds, getVessel, getYard, getYards } from "@/lib/data/public";
import { vesselStatusTone } from "@/lib/tones";
import { Container } from "@/components/ui/container";
import { Badge } from "@/components/ui/badge";
import { Reveal } from "@/components/motion/reveal";

export async function generateStaticParams() {
  const ids = await getStaticIds("vessels", "id", 10);
  return (ids.length ? ids : ["00000000-0000-4000-8000-000000000000"]).map((id) => ({ id }));
}

export async function generateMetadata({ params }: PageProps<"/[locale]/vessels/[id]">): Promise<Metadata> {
  const { locale, id } = await params;
  if (!isLocale(locale)) return {};
  const vessel = await getVessel(id);
  const t = getDictionary(locale);
  if (!vessel) return { title: t.nav.vessels };
  return pageMetadata({
    locale,
    path: `/vessels/${id}`,
    title: vessel.vessel_name,
    description: [vessel.imo_number && `IMO ${vessel.imo_number}`, t.labels.vesselType[vessel.vessel_type], vessel.flag].filter(Boolean).join(" · "),
  });
}

export default function VesselPage({ params }: PageProps<"/[locale]/vessels/[id]">) {
  return (
    <Suspense fallback={<Container className="py-24"><div className="skeleton h-96 rounded-[var(--radius-tile)]" /></Container>}>
      <VesselDetail params={params} />
    </Suspense>
  );
}

async function VesselDetail({ params }: { params: PageProps<"/[locale]/vessels/[id]">["params"] }) {
  const { locale, id } = await params;
  if (!isLocale(locale)) notFound();
  const vessel = await getVessel(id);
  if (!vessel) notFound();
  const t = getDictionary(locale);
  const v = t.vessels;
  const yards = await getYards();
  const yardRow = vessel.yard_id ? yards.find((y) => y.id === vessel.yard_id) ?? null : null;
  const yard = yardRow ? await getYard(yardRow.slug) : null;

  const rows: [string, React.ReactNode][] = [
    [v.colImo, vessel.imo_number ?? "—"],
    [v.formerNames, vessel.former_names ?? "—"],
    [v.colType, t.labels.vesselType[vessel.vessel_type]],
    [v.colFlag, vessel.flag ?? "—"],
    [v.colLdt, formatNumber(locale, vessel.ldt)],
    [v.gt, formatNumber(locale, vessel.gross_tonnage)],
    [v.dwt, formatNumber(locale, vessel.dwt)],
    [v.colBuilt, localizeDigits(locale, vessel.year_built ?? "—")],
    [v.colArrival, formatDate(locale, vessel.arrival_date, "long") || "—"],
    [v.colBeached, formatDate(locale, vessel.beaching_date, "long") || "—"],
    [v.colCutting, [formatDate(locale, vessel.cutting_started_on, "medium"), formatDate(locale, vessel.cutting_completed_on, "medium")].filter(Boolean).join(" – ") || "—"],
    [v.ihm, vessel.ihm_available === null ? "—" : vessel.ihm_available ? t.common.yes : t.common.no],
  ];

  return (
    <Container size="narrow" className="py-14 sm:py-20">
      <Link href={href(locale, "/vessels")} className="inline-flex items-center gap-1 text-[0.875rem] text-link hover:underline">
        <ChevronLeft className="size-4" />
        {t.nav.vessels}
      </Link>
      <Reveal className="mt-8">
        <div className="flex flex-wrap items-center gap-3">
          <Badge tone={vesselStatusTone[vessel.status]} dot>
            {t.labels.vesselStatus[vessel.status]}
          </Badge>
          {vessel.recycling_year && <span className="text-[0.875rem] text-fg-subtle tabular">{localizeDigits(locale, vessel.recycling_year)}</span>}
        </div>
        <h1 className="text-headline mt-4">{vessel.vessel_name}</h1>
        {yard && (
          <p className="text-lede mt-3 text-fg-subtle">
            <Link href={href(locale, `/yards/${yard.slug}`)} className="text-link hover:underline">
              {tr(yard, "name", locale)}
            </Link>
          </p>
        )}
      </Reveal>
      <Reveal delay={0.05} className="mt-10">
        <h2 className="mb-4 text-[0.9375rem] font-semibold text-fg-subtle">{v.detail}</h2>
        <dl className="divide-y divide-line rounded-[var(--radius-card)] bg-surface px-6 hairline">
          {rows.map(([label, value]) => (
            <div key={label} className="grid grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)] gap-4 py-3.5 text-[0.9375rem]">
              <dt className="text-fg-subtle">{label}</dt>
              <dd className="font-medium text-fg tabular">{value}</dd>
            </div>
          ))}
        </dl>
        {vessel.remarks && (
          <p className="mt-6 text-[0.9375rem] text-fg-subtle">
            <span className="font-medium text-fg">{v.remarks}: </span>
            {vessel.remarks}
          </p>
        )}
      </Reveal>
    </Container>
  );
}
