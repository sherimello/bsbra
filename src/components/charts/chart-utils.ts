"use client";

import { useEffect, useRef, useState } from "react";
import { formatCompact, formatNumber } from "@/lib/i18n/format";
import type { Locale } from "@/lib/i18n/config";

export interface Series {
  key: string;
  label: string;
  /** CSS colour, e.g. "var(--chart-1)". Assign in fixed order, never cycled. */
  color: string;
}

export type ValueFormat = "number" | "compact" | "percent";

export function formatValue(locale: Locale, value: number | null | undefined, format: ValueFormat = "number") {
  if (value === null || value === undefined) return "—";
  if (format === "compact") return formatCompact(locale, value);
  if (format === "percent") return `${formatNumber(locale, value, { maximumFractionDigits: 1 })}%`;
  return formatNumber(locale, value);
}

/** Round axis maximum and evenly spaced ticks (0 / 1,000 / 2,000 …). */
export function niceTicks(max: number, count = 4): number[] {
  if (max <= 0) return [0, 1];
  const rough = max / count;
  const power = 10 ** Math.floor(Math.log10(rough));
  const step = [1, 2, 2.5, 5, 10].map((m) => m * power).find((s) => s >= rough) ?? rough;
  const top = Math.ceil(max / step) * step;
  const ticks: number[] = [];
  for (let v = 0; v <= top + step / 2; v += step) ticks.push(Math.round(v * 1e6) / 1e6);
  return ticks;
}

/** Element width, tracked with ResizeObserver. */
export function useWidth<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [width, setWidth] = useState(0);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new ResizeObserver(([entry]) => setWidth(Math.floor(entry.contentRect.width)));
    observer.observe(el);
    setWidth(Math.floor(el.getBoundingClientRect().width));
    return () => observer.disconnect();
  }, []);
  return [ref, width] as const;
}

/** True once the element has scrolled into view (drives the entrance). */
export function useSeen<T extends Element>() {
  const ref = useRef<T>(null);
  const [seen, setSeen] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el || seen) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setSeen(true);
          observer.disconnect();
        }
      },
      { rootMargin: "0px 0px -15% 0px" },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [seen]);
  return [ref, seen] as const;
}
