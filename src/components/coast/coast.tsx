import Link from "next/link";
import { ArrowDownRight, ArrowUpRight, ChevronRight } from "lucide-react";
import type { Dictionary } from "@/lib/i18n";
import type { Locale } from "@/lib/i18n/config";
import { formatNumber, localizeDigits, weekdayNames } from "@/lib/i18n/format";
import { minutesBetween, type CoastConditions, type TideTurn } from "@/lib/data/coast";
import { cn } from "@/lib/utils";

type CoastDict = Dictionary["coast"];

// ---------------------------------------------------------------- formatting
const metres = (locale: Locale, value: number, signed = false) =>
  `${formatNumber(locale, value, {
    minimumFractionDigits: signed ? 2 : 1,
    maximumFractionDigits: signed ? 2 : 1,
    ...(signed ? { signDisplay: "exceptZero" } : {}),
  })} m`;

const clock = (locale: Locale, local: string) => localizeDigits(locale, local.slice(11, 16));

const compass = (c: CoastDict, degrees: number | null) =>
  degrees == null ? "" : c.compass[Math.round((((degrees % 360) + 360) % 360) / 45) % 8];

function weatherLabel(c: CoastDict, code: number | null) {
  if (code == null) return null;
  if (code <= 1) return c.weather.clear;
  if (code <= 3) return c.weather.cloudy;
  if (code === 45 || code === 48) return c.weather.fog;
  if (code >= 51 && code <= 57) return c.weather.drizzle;
  if (code >= 61 && code <= 67) return c.weather.rain;
  if (code >= 80 && code <= 82) return c.weather.showers;
  if (code >= 95) return c.weather.storm;
  return null;
}

function countdown(locale: Locale, c: CoastDict, minutes: number) {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  const parts = [h ? `${localizeDigits(locale, h)} ${c.hourShort}` : "", `${localizeDigits(locale, m)} ${c.minuteShort}`];
  return `${c.inPrefix} ${parts.filter(Boolean).join(" ")}`;
}

function nextTurn(data: CoastConditions, type: TideTurn["type"]) {
  return data.turns.find((t) => t.type === type) ?? null;
}

// ---------------------------------------------------------------- live strip (home)
/** A compact band of live readings from the coast, linking to the tide forecast. */
export function CoastStrip({
  data,
  locale,
  c,
  href,
}: {
  data: CoastConditions;
  locale: Locale;
  c: CoastDict;
  href: string;
}) {
  const high = nextTurn(data, "high");
  const low = nextTurn(data, "low");
  const sky = weatherLabel(c, data.weatherCode);
  const cells = [
    {
      label: c.seaLevel,
      value: data.seaLevel != null ? metres(locale, data.seaLevel, true) : "—",
      detail: data.trend ? (
        <span className="inline-flex items-center gap-0.5">
          {data.trend === "rising" ? <ArrowUpRight className="size-3.5" /> : <ArrowDownRight className="size-3.5" />}
          {data.trend === "rising" ? c.rising : c.falling}
        </span>
      ) : null,
    },
    high && {
      label: c.nextHigh,
      value: clock(locale, high.time),
      detail: `${metres(locale, high.height, true)} · ${countdown(locale, c, minutesBetween(data.now, high.time))}`,
    },
    low && {
      label: c.nextLow,
      value: clock(locale, low.time),
      detail: `${metres(locale, low.height, true)} · ${countdown(locale, c, minutesBetween(data.now, low.time))}`,
    },
    {
      label: c.seaAndWind,
      value: data.waveHeight != null ? `${metres(locale, data.waveHeight)}` : "—",
      detail: [
        data.wind != null ? `${c.wind} ${formatNumber(locale, Math.round(data.wind))} km/h ${compass(c, data.windDirection)}` : null,
        sky,
      ]
        .filter(Boolean)
        .join(" · "),
    },
  ].filter(Boolean) as { label: string; value: string; detail: React.ReactNode }[];

  return (
    <Link href={href} className="group block">
      <div className="flex items-center justify-between gap-4 pb-4">
        <p className="flex items-center gap-2.5 text-[0.8125rem] font-medium text-fg">
          <span className="relative flex size-2">
            <span className="absolute inline-flex size-full animate-ping rounded-full bg-ok/60 motion-reduce:animate-none" />
            <span className="relative inline-flex size-2 rounded-full bg-ok" />
          </span>
          {c.live} · {c.place}
        </p>
        <span className="inline-flex items-center gap-0.5 text-[0.8125rem] font-medium text-link">
          {c.forecastTitle}
          <ChevronRight className="size-3.5 transition-transform duration-300 group-hover:translate-x-0.5" />
        </span>
      </div>
      <dl className="grid grid-cols-2 gap-px overflow-hidden rounded-[var(--radius-card)] bg-line hairline lg:grid-cols-4">
        {cells.map((cell) => (
          <div key={cell.label} className="bg-bg px-5 py-5 sm:px-6">
            <dt className="text-[0.8125rem] text-fg-subtle">{cell.label}</dt>
            <dd className="mt-1.5 text-[1.75rem] leading-none font-semibold tracking-[-0.03em] tabular text-fg">{cell.value}</dd>
            {cell.detail && <dd className="mt-2 text-[0.8125rem] text-fg-subtle tabular">{cell.detail}</dd>}
          </div>
        ))}
      </dl>
    </Link>
  );
}

// ---------------------------------------------------------------- tide curve
/** The modelled sea level for the next two days, with highs, lows and "now". */
export function TideCurve({ data, locale, c, className }: { data: CoastConditions; locale: Locale; c: CoastDict; className?: string }) {
  const points = data.curve;
  if (points.length < 4) return null;
  const W = 1000;
  const H = 240;
  const pad = { top: 34, bottom: 30, left: 8, right: 8 };
  const start = points[0].time;
  const span = minutesBetween(start, points[points.length - 1].time);
  const levels = points.map((p) => p.level);
  const min = Math.min(...levels) - 0.3;
  const max = Math.max(...levels) + 0.3;
  const x = (time: string) => pad.left + (minutesBetween(start, time) / span) * (W - pad.left - pad.right);
  const y = (level: number) => pad.top + (1 - (level - min) / (max - min)) * (H - pad.top - pad.bottom);

  // Smooth the hourly samples with a Catmull-Rom spline.
  const xy = points.map((p) => [x(p.time), y(p.level)] as const);
  let d = `M${xy[0][0].toFixed(1)} ${xy[0][1].toFixed(1)}`;
  for (let i = 0; i < xy.length - 1; i++) {
    const [p0, p1, p2, p3] = [xy[i - 1] ?? xy[i], xy[i], xy[i + 1], xy[i + 2] ?? xy[i + 1]];
    const c1 = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6];
    const c2 = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
    d += ` C${c1[0].toFixed(1)} ${c1[1].toFixed(1)} ${c2[0].toFixed(1)} ${c2[1].toFixed(1)} ${p2[0].toFixed(1)} ${p2[1].toFixed(1)}`;
  }
  const area = `${d} L${xy[xy.length - 1][0].toFixed(1)} ${H - pad.bottom} L${xy[0][0].toFixed(1)} ${H - pad.bottom} Z`;
  const end = points[points.length - 1].time;
  const turns = data.turns.filter((t) => t.time <= end);
  const nowX = x(data.now);
  const zeroY = y(0);
  const days = weekdayNames(locale, "short");
  const midnights = points.filter((p) => p.time.endsWith("T00:00"));

  return (
    <figure className={cn("-mx-4 overflow-x-auto px-4 scrollbar-none sm:mx-0 sm:px-0", className)}>
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={c.curveLabel} className="h-auto w-full min-w-[720px] overflow-visible sm:min-w-0">
        <defs>
          <linearGradient id="tide-fill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="var(--accent)" stopOpacity="0.16" />
            <stop offset="1" stopColor="var(--accent)" stopOpacity="0" />
          </linearGradient>
        </defs>
        {midnights.map((p) => {
          const dx = x(p.time);
          const dow = new Date(`${p.time.slice(0, 10)}T12:00:00Z`).getUTCDay();
          return (
            <g key={p.time}>
              <line x1={dx} x2={dx} y1={pad.top - 10} y2={H - pad.bottom} stroke="var(--line)" />
              <text x={dx + 6} y={H - 10} fontSize="13" fill="var(--fg-faint)">
                {days[dow]}
              </text>
            </g>
          );
        })}
        <line x1={pad.left} x2={W - pad.right} y1={zeroY} y2={zeroY} stroke="var(--line-strong)" strokeDasharray="2 5" />
        <path d={area} fill="url(#tide-fill)" />
        <path d={d} fill="none" stroke="var(--accent)" strokeWidth="2.25" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
        {turns.map((t) => {
          const tx = x(t.time);
          const ty = y(t.height);
          const above = t.type === "high";
          return (
            <g key={t.time}>
              <circle cx={tx} cy={ty} r="4" fill="var(--bg)" stroke="var(--accent)" strokeWidth="2" />
              <text x={tx} y={above ? ty - 12 : ty + 22} textAnchor="middle" fontSize="13" fontWeight="600" fill="var(--fg)">
                {clock(locale, t.time)}
              </text>
            </g>
          );
        })}
        <line x1={nowX} x2={nowX} y1={pad.top - 14} y2={H - pad.bottom} stroke="var(--fg)" strokeWidth="1.25" />
        <text x={nowX - 6} y={pad.top - 16} textAnchor="end" fontSize="12" fontWeight="600" fill="var(--fg)">
          {c.now}
        </text>
      </svg>
    </figure>
  );
}

// ---------------------------------------------------------------- weekly table
/** High and low water by day for the coming week. */
export function TideWeek({ data, locale, c }: { data: CoastConditions; locale: Locale; c: CoastDict }) {
  const byDay = new Map<string, TideTurn[]>();
  for (const t of data.turns) {
    const day = t.time.slice(0, 10);
    byDay.set(day, [...(byDay.get(day) ?? []), t]);
  }
  const days = weekdayNames(locale, "short");
  const today = data.now.slice(0, 10);
  return (
    <div className="grid gap-px overflow-hidden rounded-[var(--radius-card)] bg-line hairline sm:grid-cols-2 lg:grid-cols-4">
      {[...byDay.entries()].slice(0, 8).map(([day, turns]) => {
        const date = new Date(`${day}T12:00:00Z`);
        return (
          <div key={day} className="bg-bg px-5 py-4">
            <p className="text-[0.8125rem] font-medium text-fg">
              {day === today ? c.today : days[date.getUTCDay()]}{" "}
              <span className="font-normal text-fg-faint">{localizeDigits(locale, `${date.getUTCDate()}`)}</span>
            </p>
            <ul className="mt-2.5 space-y-1.5">
              {turns.map((t) => (
                <li key={t.time} className="flex items-baseline justify-between gap-3 text-[0.9375rem] tabular">
                  <span className={cn("text-[0.75rem] font-medium", t.type === "high" ? "text-accent" : "text-fg-subtle")}>
                    {t.type === "high" ? c.high : c.low}
                  </span>
                  <span className="font-medium text-fg">{clock(locale, t.time)}</span>
                  <span className="w-16 text-right text-fg-subtle">{metres(locale, t.height, true)}</span>
                </li>
              ))}
            </ul>
          </div>
        );
      })}
    </div>
  );
}

export function CoastNote({ c, className }: { c: CoastDict; className?: string }) {
  return (
    <p className={cn("text-[0.75rem] leading-relaxed text-fg-faint", className)}>
      {c.note}{" "}
      <a href="https://open-meteo.com/" target="_blank" rel="noopener noreferrer" className="underline-offset-2 hover:underline">
        {c.source}
      </a>{" "}
      (CC BY 4.0)
    </p>
  );
}
