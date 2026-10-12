import { localeLabels, type Locale } from "./config";

const TIME_ZONE = "Asia/Dhaka";

const numberCache = new Map<string, Intl.NumberFormat>();
function numberFormat(locale: Locale, options: Intl.NumberFormatOptions = {}) {
  const key = `${locale}:${JSON.stringify(options)}`;
  let fmt = numberCache.get(key);
  if (!fmt) {
    fmt = new Intl.NumberFormat(localeLabels[locale].intl, options);
    numberCache.set(key, fmt);
  }
  return fmt;
}

export function formatNumber(locale: Locale, value: number | null | undefined, options?: Intl.NumberFormatOptions) {
  if (value === null || value === undefined || Number.isNaN(value)) return "—";
  return numberFormat(locale, options).format(value);
}

/**
 * Compact numbers with identical output on server and browser (ICU builds
 * differ: Node may print "1m" where Chrome prints "1M"). Bangla uses the
 * South Asian units হাজার, লাখ and কোটি.
 */
export function formatCompact(locale: Locale, value: number | null | undefined) {
  if (value === null || value === undefined || Number.isNaN(value)) return "—";
  const abs = Math.abs(value);
  const one = (n: number) => numberFormat(locale, { maximumFractionDigits: n >= 100 ? 0 : 1 }).format(n);
  if (locale === "bn") {
    if (abs >= 1e7) return `${one(value / 1e7)} কোটি`;
    if (abs >= 1e5) return `${one(value / 1e5)} লাখ`;
    if (abs >= 1e3) return `${one(value / 1e3)} হাজার`;
    return one(value);
  }
  if (abs >= 1e9) return `${one(value / 1e9)}B`;
  if (abs >= 1e6) return `${one(value / 1e6)}M`;
  if (abs >= 1e3) return `${one(value / 1e3)}K`;
  return one(value);
}

/** Converts Western digits in a string (e.g. "2026–2028") to the locale's digits. */
export function localizeDigits(locale: Locale, text: string | number | null | undefined) {
  if (text === null || text === undefined) return "";
  const value = String(text);
  if (locale !== "bn") return value;
  const bn = "০১২৩৪৫৬৭৮৯";
  return value.replace(/\d/g, (d) => bn[Number(d)]);
}

type DateStyle = "long" | "medium" | "short" | "monthYear" | "dayMonth" | "weekday" | "time";

const dateOptions: Record<DateStyle, Intl.DateTimeFormatOptions> = {
  long: { day: "numeric", month: "long", year: "numeric" },
  medium: { day: "numeric", month: "short", year: "numeric" },
  short: { day: "2-digit", month: "2-digit", year: "numeric" },
  monthYear: { month: "long", year: "numeric" },
  dayMonth: { day: "numeric", month: "short" },
  weekday: { weekday: "short" },
  time: { hour: "2-digit", minute: "2-digit", hour12: false },
};

function toDate(value: string | Date): Date {
  if (value instanceof Date) return value;
  // Plain dates ("2026-07-04") are calendar dates: anchor them at noon UTC so
  // they never shift across the date line when formatted in Asia/Dhaka.
  return /^\d{4}-\d{2}-\d{2}$/.test(value) ? new Date(`${value}T12:00:00Z`) : new Date(value);
}

export function formatDate(locale: Locale, value: string | Date | null | undefined, style: DateStyle = "long") {
  if (!value) return "";
  const date = toDate(value);
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat(localeLabels[locale].intl, { ...dateOptions[style], timeZone: TIME_ZONE }).format(date);
}

/** ISO calendar date (YYYY-MM-DD) for an instant, in Bangladesh time. */
export function dhakaDateKey(value: Date | string): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(toDate(value));
  return parts;
}

export function monthName(locale: Locale, monthIndex: number, style: "long" | "short" = "long") {
  return new Intl.DateTimeFormat(localeLabels[locale].intl, { month: style, timeZone: "UTC" }).format(
    new Date(Date.UTC(2026, monthIndex, 15)),
  );
}

export function weekdayNames(locale: Locale, style: "short" | "narrow" = "short") {
  // 2026-01-04 is a Sunday.
  return Array.from({ length: 7 }, (_, i) =>
    new Intl.DateTimeFormat(localeLabels[locale].intl, { weekday: style, timeZone: "UTC" }).format(
      new Date(Date.UTC(2026, 0, 4 + i, 12)),
    ),
  );
}
