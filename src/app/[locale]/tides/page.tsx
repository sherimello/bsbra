import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { connection } from "next/server";
import { AlertTriangle, ArrowDown, ArrowUp, ChevronLeft, ChevronRight, Download } from "lucide-react";
import { getDictionary, href, resolveLocale, type Dictionary, type Locale } from "@/lib/i18n";
import { tr } from "@/lib/i18n/tr";
import { dhakaDateKey, formatDate, formatNumber, localizeDigits, monthName, weekdayNames } from "@/lib/i18n/format";
import { isPreviewMode } from "@/lib/env";
import { pageMetadata } from "@/lib/seo";
import { getPage, getTideBounds, getTideEntries } from "@/lib/data/public";
import type { TideEntry } from "@/lib/types";
import { cn } from "@/lib/utils";
import { PageHero } from "@/components/site/page-hero";
import { Container } from "@/components/ui/container";
import { ButtonLink } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { FilterPills } from "@/components/ui/filter-pills";
import { TableShell, Td, Th, Tr } from "@/components/ui/table";
import { CmsSections } from "@/components/site/cms-sections";
import { Reveal } from "@/components/motion/reveal";

export async function generateMetadata({ params }: PageProps<"/[locale]/tides">): Promise<Metadata> {
  const locale = await resolveLocale(params);
  const t = getDictionary(locale);
  return pageMetadata({ locale, path: "/tides", title: t.nav.tides, description: t.tides.lede });
}

export default async function TidesPage({ params, searchParams }: PageProps<"/[locale]/tides">) {
  const locale = await resolveLocale(params);
  const t = getDictionary(locale);
  const guidance = await getPage("tides");
  return (
    <>
      <PageHero eyebrow={t.tides.eyebrow} title={t.tides.title} lede={t.tides.lede} />
      <Container className="pb-12">
        <Suspense fallback={<div className="skeleton h-[640px] rounded-[var(--radius-tile)]" />}>
          <TideMonth locale={locale} t={t} searchParams={searchParams} />
        </Suspense>
      </Container>
      {guidance && (
        <div className="bg-bg-subtle">
          <Container className="pt-16 sm:pt-20">
            <h2 className="text-headline">{tr(guidance, "title", locale)}</h2>
          </Container>
          <CmsSections body={tr(guidance, "body", locale)} locale={locale} className="pt-8 sm:pt-10" />
        </div>
      )}
    </>
  );
}

function monthKey(date: string) {
  return date.slice(0, 7);
}

function shiftMonth(key: string, delta: number) {
  const [y, m] = key.split("-").map(Number);
  const d = new Date(Date.UTC(y, m - 1 + delta, 1));
  return d.toISOString().slice(0, 7);
}

async function TideMonth({
  locale,
  t,
  searchParams,
}: {
  locale: Locale;
  t: Dictionary;
  searchParams: PageProps<"/[locale]/tides">["searchParams"];
}) {
  const sp = await searchParams;
  const bounds = await getTideBounds();
  const requested = typeof sp.month === "string" && /^\d{4}-\d{2}$/.test(sp.month) ? sp.month : null;
  let month = requested;
  if (!month) {
    await connection();
    const today = monthKey(dhakaDateKey(new Date()));
    month =
      bounds.first && bounds.last && today >= monthKey(bounds.first) && today <= monthKey(bounds.last)
        ? today
        : bounds.last
          ? monthKey(bounds.last)
          : today;
  }
  const view = sp.view === "table" ? "table" : "calendar";
  const [year, mon] = month.split("-").map(Number);
  const daysInMonth = new Date(Date.UTC(year, mon, 0)).getUTCDate();
  const from = `${month}-01`;
  const to = `${month}-${String(daysInMonth).padStart(2, "0")}`;
  const entries = await getTideEntries(from, to);
  const td = t.tides;
  const path = href(locale, "/tides");

  const byDay = new Map<string, TideEntry[]>();
  for (const e of entries) byDay.set(e.tide_date, [...(byDay.get(e.tide_date) ?? []), e]);

  const highs = entries.filter((e) => e.tide_type === "high");
  const lows = entries.filter((e) => e.tide_type === "low");
  const highest = highs.reduce<TideEntry | null>((a, e) => (!a || e.height_m > a.height_m ? e : a), null);
  const lowest = lows.reduce<TideEntry | null>((a, e) => (!a || e.height_m < a.height_m ? e : a), null);
  // Beaching window: days whose highest tide is in the top 20% of the month.
  const dayMax = [...byDay.entries()].map(([d, list]) => [d, Math.max(...list.filter((e) => e.tide_type === "high").map((e) => e.height_m), 0)] as const);
  const threshold = [...dayMax].map(([, h]) => h).sort((a, b) => b - a)[Math.max(0, Math.floor(dayMax.length * 0.2) - 1)] ?? Infinity;
  const windowDays = new Set(dayMax.filter(([, h]) => h >= threshold && h > 0).map(([d]) => d));

  const canPrev = !bounds.first || shiftMonth(month, -1) >= monthKey(bounds.first);
  const canNext = !bounds.last || shiftMonth(month, 1) <= monthKey(bounds.last);
  const qs = (m: string, v = view) => `${path}?month=${m}${v === "table" ? "&view=table" : ""}`;
  const time = (e: TideEntry) => localizeDigits(locale, e.tide_time.slice(0, 5));
  const height = (e: TideEntry) => `${formatNumber(locale, e.height_m, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${td.metres}`;

  const firstWeekday = new Date(Date.UTC(year, mon - 1, 1)).getUTCDay();
  const cells: (string | null)[] = [
    ...Array.from({ length: firstWeekday }, () => null),
    ...Array.from({ length: daysInMonth }, (_, i) => `${month}-${String(i + 1).padStart(2, "0")}`),
  ];
  const weekdays = weekdayNames(locale, "short");

  return (
    <>
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-2">
          <Link
            href={canPrev ? qs(shiftMonth(month, -1)) : "#"}
            aria-disabled={!canPrev}
            scroll={false}
            className={cn("press grid size-10 place-items-center rounded-full bg-bg-muted", !canPrev && "pointer-events-none opacity-30")}
            aria-label={t.common.previous}
          >
            <ChevronLeft className="size-5" />
          </Link>
          <h2 className="min-w-48 text-center text-[1.5rem] font-semibold tracking-[-0.02em] tabular">
            {monthName(locale, mon - 1)} {localizeDigits(locale, year)}
          </h2>
          <Link
            href={canNext ? qs(shiftMonth(month, 1)) : "#"}
            aria-disabled={!canNext}
            scroll={false}
            className={cn("press grid size-10 place-items-center rounded-full bg-bg-muted", !canNext && "pointer-events-none opacity-30")}
            aria-label={t.common.next}
          >
            <ChevronRight className="size-5" />
          </Link>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <FilterPills
            label={td.calendar}
            items={[
              { label: td.calendar, href: qs(month, "calendar"), active: view === "calendar" },
              { label: td.table, href: qs(month, "table"), active: view === "table" },
            ]}
          />
          {entries.length > 0 && (
            <ButtonLink href={`/api/reports/tides?month=${month}`} variant="secondary" size="sm" prefetch={false}>
              <Download />
              {td.download}
            </ButtonLink>
          )}
        </div>
      </div>

      {entries.length === 0 ? (
        <EmptyState className="mt-8" title={td.noData} />
      ) : (
        <>
          <div className="mt-8 grid gap-3 sm:grid-cols-3">
            <Highlight icon={<ArrowUp className="size-4" />} label={td.highestOfMonth} value={highest ? height(highest) : "—"} sub={highest ? `${formatDate(locale, highest.tide_date, "dayMonth")} · ${time(highest)}` : ""} />
            <Highlight icon={<ArrowDown className="size-4" />} label={td.lowestOfMonth} value={lowest ? height(lowest) : "—"} sub={lowest ? `${formatDate(locale, lowest.tide_date, "dayMonth")} · ${time(lowest)}` : ""} />
            <div className="rounded-[var(--radius-card)] bg-brand-soft p-5">
              <p className="text-[0.8125rem] font-medium text-brand">{td.beachingWindow}</p>
              <p className="mt-1 text-[1.25rem] font-semibold tracking-[-0.02em] text-fg tabular">
                {[...windowDays].sort().map((d) => localizeDigits(locale, Number(d.slice(8)))).join(", ")}
              </p>
              <p className="mt-1 text-[0.75rem] text-fg-subtle">{td.beachingWindowHint}</p>
            </div>
          </div>

          {/* Calendar — large screens */}
          {view === "calendar" && (
            <Reveal className="mt-8 hidden lg:block">
              <div className="grid grid-cols-7 gap-px overflow-hidden rounded-[var(--radius-tile)] bg-line hairline">
                {weekdays.map((w) => (
                  <div key={w} className="bg-bg-subtle px-3 py-2.5 text-[0.75rem] font-semibold text-fg-subtle">
                    {w}
                  </div>
                ))}
                {cells.map((day, i) => {
                  if (!day) return <div key={`empty-${i}`} className="bg-bg-subtle/50" />;
                  const list = byDay.get(day) ?? [];
                  const inWindow = windowDays.has(day);
                  return (
                    <div key={day} className={cn("min-h-32 bg-bg p-3", inWindow && "bg-brand-soft")}>
                      <div className="mb-2 flex items-center justify-between">
                        <span className="text-[0.9375rem] font-semibold tabular">{localizeDigits(locale, Number(day.slice(8)))}</span>
                        {inWindow && <span className="size-1.5 rounded-full bg-brand" aria-label={td.beachingWindow} />}
                      </div>
                      <ul className="space-y-1 text-[0.75rem] tabular">
                        {list.map((e) => (
                          <li key={e.id} className="flex items-center justify-between gap-1">
                            <span className={cn("inline-flex items-center gap-1", e.tide_type === "high" ? "text-fg" : "text-fg-subtle")}>
                              {e.tide_type === "high" ? <ArrowUp className="size-3 text-brand" /> : <ArrowDown className="size-3" />}
                              {time(e)}
                            </span>
                            <span className={e.tide_type === "high" ? "font-medium text-fg" : "text-fg-subtle"}>
                              {formatNumber(locale, e.height_m, { minimumFractionDigits: 1, maximumFractionDigits: 1 })}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  );
                })}
              </div>
            </Reveal>
          )}

          {/* Table — always on small screens, on request on large screens */}
          <div className={cn("mt-8", view === "calendar" && "lg:hidden")}>
            <TableShell>
              <thead>
                <tr>
                  <Th>{t.common.date}</Th>
                  <Th>{td.high}</Th>
                  <Th>{td.low}</Th>
                </tr>
              </thead>
              <tbody>
                {[...byDay.entries()].map(([day, list]) => (
                  <Tr key={day} className={windowDays.has(day) ? "bg-brand-soft" : undefined}>
                    <Td className="font-medium whitespace-nowrap text-fg">{formatDate(locale, day, "weekday")} {formatDate(locale, day, "dayMonth")}</Td>
                    <Td className="tabular">
                      {list.filter((e) => e.tide_type === "high").map((e) => (
                        <div key={e.id}>
                          {time(e)} · <span className="font-medium text-fg">{height(e)}</span>
                        </div>
                      ))}
                    </Td>
                    <Td className="tabular">
                      {list.filter((e) => e.tide_type === "low").map((e) => (
                        <div key={e.id}>
                          {time(e)} · {height(e)}
                        </div>
                      ))}
                    </Td>
                  </Tr>
                ))}
              </tbody>
            </TableShell>
          </div>

          <div className="mt-6 flex gap-3 rounded-[var(--radius-card)] bg-warn-soft p-5 text-[0.875rem] text-fg-muted">
            <AlertTriangle className="mt-0.5 size-5 shrink-0 text-warn" />
            <div>
              {isPreviewMode && <p className="mb-1 font-semibold text-fg">{td.previewDisclaimer}</p>}
              <p>
                {td.station}: {entries[0]?.station}. {td.disclaimer}
              </p>
            </div>
          </div>
        </>
      )}
    </>
  );
}

function Highlight({ icon, label, value, sub }: { icon: React.ReactNode; label: string; value: string; sub: string }) {
  return (
    <div className="rounded-[var(--radius-card)] bg-surface p-5 hairline">
      <p className="flex items-center gap-1.5 text-[0.8125rem] text-fg-subtle">
        {icon}
        {label}
      </p>
      <p className="mt-1 text-[1.5rem] font-semibold tracking-[-0.02em] text-fg tabular">{value}</p>
      <p className="mt-0.5 text-[0.8125rem] text-fg-subtle tabular">{sub}</p>
    </div>
  );
}
