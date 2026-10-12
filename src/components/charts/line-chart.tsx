"use client";

import { useState } from "react";
import { m, useReducedMotion } from "motion/react";
import type { Locale } from "@/lib/i18n/config";
import { localizeDigits } from "@/lib/i18n/format";
import { ChartLegend, ChartTooltip } from "./chart-legend";
import { formatValue, niceTicks, useSeen, useWidth, type Series, type ValueFormat } from "./chart-utils";

export interface LineDatum {
  label: string | number;
  values: Record<string, number | null>;
}

/**
 * Lines over an ordered axis with a crosshair tooltip. 2px lines, end-dots
 * with a surface ring, direct end labels for up to four series, and a 10%
 * area wash when a single series is shown.
 */
export function LineChart({
  data,
  series,
  locale,
  format = "number",
  height = 280,
  ariaLabel,
}: {
  data: LineDatum[];
  series: Series[];
  locale: Locale;
  format?: ValueFormat;
  height?: number;
  ariaLabel: string;
}) {
  const [wrapRef, width] = useWidth<HTMLDivElement>();
  const [seenRef, seen] = useSeen<HTMLDivElement>();
  const reduced = useReducedMotion();
  const [active, setActive] = useState<number | null>(null);

  const labelRoom = series.length > 1 && series.length <= 4 ? 96 : 12;
  const pad = { top: 16, right: labelRoom, bottom: 28, left: 44 };
  const innerW = Math.max(0, width - pad.left - pad.right);
  const innerH = height - pad.top - pad.bottom;
  const max = Math.max(0, ...data.flatMap((d) => series.map((s) => d.values[s.key] ?? 0)));
  const ticks = niceTicks(max);
  const top = ticks[ticks.length - 1] || 1;
  const step = data.length > 1 ? innerW / (data.length - 1) : innerW;
  const x = (i: number) => (data.length > 1 ? i * step : innerW / 2);
  const y = (v: number) => innerH - (v / top) * innerH;
  const showEvery = step < 34 ? Math.ceil(34 / step) : 1;

  const pathFor = (key: string) =>
    data
      .map((d, i) => (d.values[key] === null || d.values[key] === undefined ? null : `${x(i)} ${y(d.values[key] as number)}`))
      .filter(Boolean)
      .map((p, i) => `${i === 0 ? "M" : "L"}${p}`)
      .join(" ");

  const onMove = (e: React.MouseEvent<SVGRectElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const px = e.clientX - rect.left;
    setActive(Math.max(0, Math.min(data.length - 1, Math.round(px / (step || 1)))));
  };

  const last = data.length - 1;

  return (
    <div ref={seenRef}>
      {series.length > 1 && (
        <div className="mb-4">
          <ChartLegend series={series} kind="line" />
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
              {data.map((d, i) =>
                i % showEvery === 0 ? (
                  <text key={String(d.label)} x={x(i)} y={innerH + 18} textAnchor="middle" className="fill-fg-subtle text-[11px] tabular">
                    {localizeDigits(locale, d.label)}
                  </text>
                ) : null,
              )}

              {series.length === 1 && data.length > 1 && (
                <m.path
                  d={`${pathFor(series[0].key)} L${x(last)} ${innerH} L${x(0)} ${innerH} Z`}
                  fill={series[0].color}
                  fillOpacity={0.1}
                  initial={{ opacity: 0 }}
                  animate={seen ? { opacity: 1 } : undefined}
                  transition={{ duration: 0.8, delay: reduced ? 0 : 0.5 }}
                />
              )}

              {series.map((s) => (
                <m.path
                  key={s.key}
                  d={pathFor(s.key)}
                  fill="none"
                  stroke={s.color}
                  strokeWidth={2}
                  strokeLinejoin="round"
                  strokeLinecap="round"
                  initial={reduced ? { opacity: 0 } : { pathLength: 0 }}
                  animate={seen ? (reduced ? { opacity: 1 } : { pathLength: 1 }) : undefined}
                  transition={{ duration: reduced ? 0.3 : 1.2, ease: [0.22, 1, 0.36, 1] }}
                />
              ))}

              {active !== null && (
                <line x1={x(active)} x2={x(active)} y1={0} y2={innerH} stroke="var(--line-strong)" />
              )}

              {series.map((s) => {
                const idx = active ?? last;
                const v = data[idx]?.values[s.key];
                if (v === null || v === undefined) return null;
                return (
                  <m.circle
                    key={s.key}
                    cx={x(idx)}
                    cy={y(v)}
                    r={4.5}
                    fill={s.color}
                    stroke="var(--surface)"
                    strokeWidth={2}
                    initial={{ opacity: 0 }}
                    animate={seen ? { opacity: 1 } : undefined}
                    transition={{ delay: reduced ? 0 : 1 }}
                  />
                );
              })}

              {/* Direct end labels (≤ 4 series), in text colour beside the coloured line. */}
              {series.length > 1 &&
                series.length <= 4 &&
                series.map((s) => {
                  const v = data[last]?.values[s.key];
                  if (v === null || v === undefined) return null;
                  return (
                    <text key={s.key} x={x(last) + 10} y={y(v)} dy="0.32em" className="fill-fg-muted text-[11px] font-medium">
                      {s.label}
                    </text>
                  );
                })}

              <line x1={0} x2={innerW} y1={innerH} y2={innerH} stroke="var(--line-strong)" />
              <rect
                x={-step / 2}
                y={0}
                width={innerW + step}
                height={innerH}
                fill="transparent"
                onMouseMove={onMove}
                tabIndex={0}
                aria-label={ariaLabel}
                onKeyDown={(e) => {
                  if (e.key === "ArrowRight") setActive((a) => Math.min(last, (a ?? -1) + 1));
                  if (e.key === "ArrowLeft") setActive((a) => Math.max(0, (a ?? last + 1) - 1));
                }}
                onBlur={() => setActive(null)}
                className="outline-none"
              />
            </g>
          </svg>
        )}
        {active !== null && data[active] && (
          <ChartTooltip
            x={pad.left + x(active)}
            y={pad.top + innerH / 2}
            title={localizeDigits(locale, data[active].label)}
            rows={series.map((s) => ({ label: s.label, value: formatValue(locale, data[active].values[s.key], format), color: s.color }))}
            containerWidth={width}
          />
        )}
      </div>
    </div>
  );
}
