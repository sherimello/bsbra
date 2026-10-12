"use client";

import { useState } from "react";
import { m, useReducedMotion } from "motion/react";
import type { Locale } from "@/lib/i18n/config";
import { localizeDigits } from "@/lib/i18n/format";
import { spring } from "@/components/motion/springs";
import { ChartLegend, ChartTooltip } from "./chart-legend";
import { formatValue, niceTicks, useSeen, useWidth, type Series, type ValueFormat } from "./chart-utils";

export interface ColumnDatum {
  label: string | number;
  values: Record<string, number | null>;
}

/**
 * Vertical columns over a category axis (typically years). Bars are capped
 * at 24px, rounded only at the data end, separated by a 2px surface gap when
 * grouped, and grow from a single baseline when first seen.
 */
export function ColumnChart({
  data,
  series,
  locale,
  format = "number",
  height = 280,
  ariaLabel,
  highlightLast = true,
}: {
  data: ColumnDatum[];
  series: Series[];
  locale: Locale;
  format?: ValueFormat;
  height?: number;
  ariaLabel: string;
  highlightLast?: boolean;
}) {
  const [wrapRef, width] = useWidth<HTMLDivElement>();
  const [seenRef, seen] = useSeen<HTMLDivElement>();
  const reduced = useReducedMotion();
  const [active, setActive] = useState<number | null>(null);

  const pad = { top: 16, right: 4, bottom: 28, left: 44 };
  const innerW = Math.max(0, width - pad.left - pad.right);
  const innerH = height - pad.top - pad.bottom;
  const max = Math.max(0, ...data.flatMap((d) => series.map((s) => d.values[s.key] ?? 0)));
  const ticks = niceTicks(max);
  const top = ticks[ticks.length - 1] || 1;
  const band = data.length ? innerW / data.length : 0;
  const gap = 2;
  const barW = Math.max(4, Math.min(24, (band * 0.62 - gap * (series.length - 1)) / series.length));
  const groupW = barW * series.length + gap * (series.length - 1);
  const y = (v: number) => innerH - (v / top) * innerH;
  const showEvery = band < 34 ? Math.ceil(34 / band) : 1;

  return (
    <div ref={seenRef}>
      {series.length > 1 && (
        <div className="mb-4">
          <ChartLegend series={series} />
        </div>
      )}
      <div ref={wrapRef} className="relative" onMouseLeave={() => setActive(null)}>
        {width > 0 && (
          <svg width={width} height={height} role="img" aria-label={ariaLabel} className="overflow-visible">
            <g transform={`translate(${pad.left} ${pad.top})`}>
              {ticks.map((t) => (
                <g key={t} transform={`translate(0 ${y(t)})`}>
                  <line x1={0} x2={innerW} stroke="var(--chart-grid)" />
                  <text x={-10} dy="0.32em" textAnchor="end" className="fill-fg-faint text-[11px] tabular">
                    {formatValue(locale, t, format === "percent" ? "percent" : "compact")}
                  </text>
                </g>
              ))}
              {data.map((d, i) => {
                const x0 = i * band + (band - groupW) / 2;
                const dimmed = active !== null && active !== i;
                return (
                  <g key={String(d.label)} opacity={dimmed ? 0.45 : 1} style={{ transition: "opacity 200ms" }}>
                    {series.map((s, si) => {
                      const v = d.values[s.key] ?? 0;
                      const h = innerH - y(v);
                      const x = x0 + si * (barW + gap);
                      const r = Math.min(4, barW / 2, h);
                      const path =
                        h <= 0
                          ? ""
                          : `M${x} ${innerH} V${innerH - h + r} Q${x} ${innerH - h} ${x + r} ${innerH - h} H${x + barW - r} Q${x + barW} ${innerH - h} ${x + barW} ${innerH - h + r} V${innerH} Z`;
                      const muted = series.length === 1 && highlightLast && i !== data.length - 1 && active === null;
                      return (
                        <m.path
                          key={s.key}
                          d={path}
                          fill={s.color}
                          fillOpacity={muted ? 0.55 : 1}
                          style={{ originY: `${innerH}px`, transformBox: "view-box" }}
                          initial={reduced ? { opacity: 0 } : { scaleY: 0 }}
                          animate={seen ? (reduced ? { opacity: 1 } : { scaleY: 1 }) : undefined}
                          transition={{ ...spring.reveal, delay: reduced ? 0 : i * 0.035 }}
                        />
                      );
                    })}
                    {i % showEvery === 0 && (
                      <text x={i * band + band / 2} y={innerH + 18} textAnchor="middle" className="fill-fg-subtle text-[11px] tabular">
                        {localizeDigits(locale, d.label)}
                      </text>
                    )}
                    {/* Hit target spans the whole band, larger than the mark. */}
                    <rect
                      x={i * band}
                      y={0}
                      width={band}
                      height={innerH}
                      fill="transparent"
                      tabIndex={0}
                      aria-label={`${d.label}: ${series.map((s) => `${s.label} ${formatValue(locale, d.values[s.key], format)}`).join(", ")}`}
                      onMouseEnter={() => setActive(i)}
                      onFocus={() => setActive(i)}
                      onBlur={() => setActive(null)}
                      className="outline-none"
                    />
                  </g>
                );
              })}
              <line x1={0} x2={innerW} y1={innerH} y2={innerH} stroke="var(--line-strong)" />
            </g>
          </svg>
        )}
        {active !== null && data[active] && (
          <ChartTooltip
            x={pad.left + active * band + band / 2}
            y={pad.top + y(Math.max(...series.map((s) => data[active].values[s.key] ?? 0)))}
            title={localizeDigits(locale, data[active].label)}
            rows={series.map((s) => ({ label: s.label, value: formatValue(locale, data[active].values[s.key], format), color: s.color }))}
            containerWidth={width}
          />
        )}
      </div>
    </div>
  );
}
