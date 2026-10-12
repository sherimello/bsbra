"use client";

import { m, useReducedMotion } from "motion/react";
import type { Locale } from "@/lib/i18n/config";
import { spring } from "@/components/motion/springs";
import { formatValue, useSeen, type ValueFormat } from "./chart-utils";

/**
 * Ranked horizontal bars — the right form for shares across categories
 * (instead of a pie). Value at the tip, label above, one colour.
 */
export function HBarChart({
  items,
  locale,
  color = "var(--chart-1)",
  format = "number",
  ariaLabel,
  total,
}: {
  items: { label: string; value: number }[];
  locale: Locale;
  color?: string;
  format?: ValueFormat;
  ariaLabel: string;
  total?: number;
}) {
  const [ref, seen] = useSeen<HTMLUListElement>();
  const reduced = useReducedMotion();
  const max = Math.max(1, ...items.map((i) => i.value));

  return (
    <ul ref={ref} aria-label={ariaLabel} className="space-y-3.5">
      {items.map((item, i) => {
        const share = total ? (item.value / total) * 100 : null;
        return (
          <li key={item.label} className="grid grid-cols-[1fr_auto] items-center gap-x-4 gap-y-1.5">
            <span className="truncate text-[0.875rem] text-fg-muted">{item.label}</span>
            <span className="text-[0.8125rem] font-medium text-fg tabular">
              {formatValue(locale, item.value, format)}
              {share !== null && <span className="ml-1.5 font-normal text-fg-faint">{formatValue(locale, share, "percent")}</span>}
            </span>
            <div className="col-span-2 h-2.5 overflow-hidden rounded-full bg-bg-muted">
              <m.div
                className="h-full rounded-full"
                style={{ background: color, originX: 0, width: `${(item.value / max) * 100}%` }}
                initial={reduced ? { opacity: 0 } : { scaleX: 0 }}
                animate={seen ? (reduced ? { opacity: 1 } : { scaleX: 1 }) : undefined}
                transition={{ ...spring.reveal, delay: reduced ? 0 : i * 0.05 }}
              />
            </div>
          </li>
        );
      })}
    </ul>
  );
}
