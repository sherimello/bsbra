import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { notFound } from "next/navigation";
import { Check, ChevronLeft, ExternalLink, Globe, Mail, MapPin, Phone, ShieldCheck } from "lucide-react";
import { getDictionary, href, isLocale, type Dictionary, type Locale } from "@/lib/i18n";
import { tr, trList } from "@/lib/i18n/tr";
import { formatDate, formatNumber } from "@/lib/i18n/format";
import { mediaUrl } from "@/lib/env";
import { pageMetadata } from "@/lib/seo";
import { getStaticIds, getYard, getYardSummaries, getYardVessels } from "@/lib/data/public";
import { vesselStatusTone, yardStatusTone } from "@/lib/tones";
import { Container } from "@/components/ui/container";
import { Badge } from "@/components/ui/badge";
import { AppImage } from "@/components/ui/app-image";
import { TableShell, Td, Th, Tr } from "@/components/ui/table";
import { Reveal, RevealGroup, RevealItem } from "@/components/motion/reveal";

export async function generateStaticParams() {
  const slugs = await getStaticIds("yards", "slug", 20);
  return (slugs.length ? slugs : ["yard"]).map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: PageProps<"/[locale]/yards/[slug]">): Promise<Metadata> {
  const { locale, slug } = await params;
  if (!isLocale(locale)) return {};
  const yard = await getYard(slug);
  if (!yard) return {};
  return pageMetadata({
    locale,
    path: `/yards/${slug}`,
    title: tr(yard, "name", locale),
    description: tr(yard, "description", locale),
    image: mediaUrl(yard.cover_image),
  });
}

export default function YardPage({ params }: PageProps<"/[locale]/yards/[slug]">) {
  return (
    <Suspense fallback={<Container className="py-20"><div className="skeleton aspect-[21/9] rounded-[var(--radius-tile)]" /></Container>}>
      <YardDetail params={params} />
    </Suspense>
  );
}

async function YardDetail({ params }: { params: PageProps<"/[locale]/yards/[slug]">["params"] }) {
  const { locale, slug } = await params;
  if (!isLocale(locale)) notFound();
  const yard = await getYard(slug);
  if (!yard) notFound();
  const t = getDictionary(locale);
  const y = t.yards;
  const [vessels, summaries] = await Promise.all([getYardVessels(yard.id, 8), getYardSummaries()]);
  const summary = summaries.find((s) => s.yard_id === yard.id);
  const name = tr(yard, "name", locale);

  const facilityGroups = [
    { title: y.facilities, items: trList(yard, "facilities", locale) },
    { title: y.environmental, items: trList(yard, "environmental", locale) },
    { title: y.safety, items: trList(yard, "safety", locale) },
    { title: y.waste, items: trList(yard, "waste", locale) },
  ].filter((g) => g.items.length);

  const facts = [
    { label: y.vesselsRecycled, value: formatNumber(locale, summary?.vessels ?? 0) },
    { label: t.industry.kpiLdt, value: formatNumber(locale, Math.round(summary?.total_ldt ?? 0)) },
    { label: y.area, value: yard.yard_area_sqm ? `${formatNumber(locale, yard.yard_area_sqm)} ${y.sqm}` : "—" },
    { label: y.capacity, value: yard.capacity_ldt_per_year ? `${formatNumber(locale, yard.capacity_ldt_per_year)} ${y.ldtPerYear}` : "—" },
  ];

  return (
    <>
      <Container className="pt-10 sm:pt-14">
        <Link href={href(locale, "/yards")} className="inline-flex items-center gap-1 text-[0.875rem] text-link hover:underline">
          <ChevronLeft className="size-4" />
          {y.back}
        </Link>
        <Reveal className="mt-8 max-w-4xl">
          <div className="flex flex-wrap items-center gap-2">
            <Badge tone={yardStatusTone[yard.status]} dot>
              {t.labels.yardStatus[yard.status]}
            </Badge>
            {yard.hkc_compliant && (
              <Badge tone="brand">
                <ShieldCheck className="size-3" />
                {y.hkc}
              </Badge>
            )}
          </div>
          <h1 className="text-display mt-5 text-balance">{name}</h1>
          {yard.address_en && (
            <p className="text-lede mt-4 flex items-center gap-2 text-fg-subtle">
              <MapPin className="size-5 shrink-0" />
              {tr(yard, "address", locale)}
            </p>
          )}
        </Reveal>
        <Reveal delay={0.06} className="relative mt-10 aspect-[16/9] overflow-hidden rounded-[var(--radius-tile)] bg-bg-muted sm:aspect-[21/9]">
          <AppImage src={yard.cover_image} alt={name} seed={yard.slug} priority sizes="100vw" />
        </Reveal>
      </Container>

      <Container className="py-14 sm:py-20">
        <RevealGroup className="grid grid-cols-2 gap-px overflow-hidden rounded-[var(--radius-tile)] bg-line lg:grid-cols-4">
          {facts.map((f) => (
            <RevealItem key={f.label} className="bg-bg p-6 sm:p-8">
              <p className="text-[1.75rem] leading-none font-semibold tracking-[-0.03em] text-fg">{f.value}</p>
              <p className="mt-2 text-[0.875rem] text-fg-subtle">{f.label}</p>
            </RevealItem>
          ))}
        </RevealGroup>

        <div className="mt-16 grid gap-12 lg:grid-cols-[7fr_5fr] lg:gap-16">
          <div>
            <Reveal>
              <h2 className="text-title">{y.overview}</h2>
              <p className="mt-4 text-[1.1875rem] leading-relaxed text-fg-muted">{tr(yard, "description", locale)}</p>
            </Reveal>
            {facilityGroups.length > 0 && (
              <div className="mt-12 grid gap-4 sm:grid-cols-2">
                {facilityGroups.map((g, i) => (
                  <Reveal key={g.title} delay={i * 0.04}>
                    <div className="h-full rounded-[var(--radius-card)] bg-bg-subtle p-6">
                      <h3 className="text-[1rem] font-semibold">{g.title}</h3>
                      <ul className="mt-4 space-y-2.5">
                        {g.items.map((item) => (
                          <li key={item} className="flex gap-2.5 text-[0.9375rem] text-fg-muted">
                            <Check className="mt-1 size-4 shrink-0 text-ok" strokeWidth={2.2} />
                            {item}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </Reveal>
                ))}
              </div>
            )}
          </div>

          <aside className="space-y-4">
            {(yard.certifying_body || yard.certificate_no) && (
              <Reveal>
                <div className="rounded-[var(--radius-card)] bg-bg-subtle p-6">
                  <ShieldCheck className="size-6 text-ok" strokeWidth={1.7} />
                  <h3 className="mt-4 text-[1rem] font-semibold">{y.certificate}</h3>
                  <dl className="mt-4 space-y-3 text-[0.875rem]">
                    {yard.certifying_body && <Fact label={y.certifiedBy} value={yard.certifying_body} />}
                    {yard.certificate_no && <Fact label={y.certificate} value={yard.certificate_no} />}
                    {yard.certificate_issued_on && <Fact label={y.issued} value={formatDate(locale, yard.certificate_issued_on, "long")} />}
                    {yard.certificate_expires_on && <Fact label={y.validUntil} value={formatDate(locale, yard.certificate_expires_on, "long")} />}
                  </dl>
                </div>
              </Reveal>
            )}
            {yard.show_contact && (yard.contact_person || yard.phone || yard.email || yard.website || yard.owner_company) && (
              <Reveal delay={0.04}>
                <div className="rounded-[var(--radius-card)] bg-surface p-6 hairline">
                  <h3 className="text-[1rem] font-semibold">{y.contact}</h3>
                  <ul className="mt-4 space-y-2.5 text-[0.9375rem]">
                    {yard.owner_company && <li className="text-fg-muted">{yard.owner_company}</li>}
                    {yard.contact_person && <li className="text-fg-muted">{yard.contact_person}</li>}
                    {yard.phone && (
                      <li>
                        <a href={`tel:${yard.phone}`} className="inline-flex items-center gap-2 text-link hover:underline">
                          <Phone className="size-4" />
                          {yard.phone}
                        </a>
                      </li>
                    )}
                    {yard.email && (
                      <li>
                        <a href={`mailto:${yard.email}`} className="inline-flex items-center gap-2 text-link hover:underline">
                          <Mail className="size-4" />
                          {yard.email}
                        </a>
                      </li>
                    )}
                    {yard.website && (
                      <li>
                        <a href={yard.website} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-link hover:underline">
                          <Globe className="size-4" />
                          {t.common.website}
                        </a>
                      </li>
                    )}
                  </ul>
                </div>
              </Reveal>
            )}
            {yard.latitude !== null && yard.longitude !== null && (
              <Reveal delay={0.08}>
                <div className="overflow-hidden rounded-[var(--radius-card)] bg-surface hairline">
                  <iframe
                    title={`${y.location} — ${name}`}
                    src={`https://maps.google.com/maps?q=${yard.latitude},${yard.longitude}&z=14&output=embed`}
                    className="aspect-[4/3] w-full border-0 grayscale-[30%]"
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                  />
                  <a
                    href={`https://www.google.com/maps/search/?api=1&query=${yard.latitude},${yard.longitude}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between px-5 py-3.5 text-[0.875rem] font-medium text-link hover:underline"
                  >
                    {y.directions}
                    <ExternalLink className="size-4" />
                  </a>
                </div>
              </Reveal>
            )}
          </aside>
        </div>

        {vessels.length > 0 && (
          <RecentVessels locale={locale} t={t} vessels={vessels} />
        )}
      </Container>
    </>
  );
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4 border-b border-line pb-3 last:border-0 last:pb-0">
      <dt className="text-fg-subtle">{label}</dt>
      <dd className="text-right font-medium">{value}</dd>
    </div>
  );
}

function RecentVessels({ locale, t, vessels }: { locale: Locale; t: Dictionary; vessels: Awaited<ReturnType<typeof getYardVessels>> }) {
  const v = t.vessels;
  return (
    <Reveal className="mt-20">
      <div className="mb-6 flex items-end justify-between gap-4">
        <h2 className="text-title">{t.yards.recentVessels}</h2>
        <Link href={href(locale, "/vessels")} className="text-[0.9375rem] font-medium text-link hover:underline">
          {t.common.viewAll}
        </Link>
      </div>
      <TableShell>
        <thead>
          <tr>
            <Th>{v.colVessel}</Th>
            <Th>{v.colImo}</Th>
            <Th>{v.colType}</Th>
            <Th numeric>{v.colLdt}</Th>
            <Th>{v.colBeached}</Th>
            <Th>{v.colStatus}</Th>
          </tr>
        </thead>
        <tbody>
          {vessels.map((row) => (
            <Tr key={row.id}>
              <Td className="font-semibold text-fg">
                <Link href={href(locale, `/vessels/${row.id}`)} className="hover:text-link hover:underline">
                  {row.vessel_name}
                </Link>
              </Td>
              <Td className="tabular">{row.imo_number ?? "—"}</Td>
              <Td>{t.labels.vesselType[row.vessel_type]}</Td>
              <Td numeric>{formatNumber(locale, row.ldt)}</Td>
              <Td className="tabular">{formatDate(locale, row.beaching_date, "medium") || "—"}</Td>
              <Td>
                <Badge tone={vesselStatusTone[row.status]} dot>
                  {t.labels.vesselStatus[row.status]}
                </Badge>
              </Td>
            </Tr>
          ))}
        </tbody>
      </TableShell>
    </Reveal>
  );
}
