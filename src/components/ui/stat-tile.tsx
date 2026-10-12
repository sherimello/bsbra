import { ArrowDownRight, ArrowUpRight } from "lucide-react";
import type { Locale } from "@/lib/i18n/config";
import { formatNumber } from "@/lib/i18n/format";
import { CountUp } from "@/components/motion/count-up";
import { cn } from "@/lib/utils";

/** Stat tile: label · value · optional delta vs a named period. */
export function StatTile({
  label,
  value,
  previous,
  locale,
  compact,
  suffix,
  deltaLabel,
  upIsGood = true,
  className,
  fractionDigits = 0,
}: {
  label: string;
  value: number | null | undefined;
  previous?: number | null;
  locale: Locale;
  compact?: boolean;
  suffix?: string;
  deltaLabel?: string;
  upIsGood?: boolean;
  className?: string;
  fractionDigits?: number;
}) {
  const delta =
    value !== null && value !== undefined && previous ? ((value - previous) / Math.abs(previous)) * 100 : null;
  const up = delta !== null && delta >= 0;
  const good = delta === null ? null : up === upIsGood;

  return (
    <div className={cn("rounded-[var(--radius-card)] bg-surface p-6 hairline", className)}>
      <p className="text-[0.8125rem] text-fg-subtle">{label}</p>
      <p className="mt-2 text-[2.25rem] leading-none font-semibold tracking-[-0.03em] text-fg">
        {value === null || value === undefined ? (
          "—"
        ) : (
          <CountUp value={value} locale={locale} compact={compact} suffix={suffix} maximumFractionDigits={fractionDigits} />
        )}
      </p>
      {delta !== null && (
        <p className={cn("mt-3 inline-flex items-center gap-1 text-[0.8125rem] font-medium", good ? "text-ok" : "text-danger")}>
          {up ? <ArrowUpRight className="size-3.5" /> : <ArrowDownRight className="size-3.5" />}
          {formatNumber(locale, Math.abs(delta), { maximumFractionDigits: 1 })}%
          {deltaLabel && <span className="font-normal text-fg-subtle">{deltaLabel}</span>}
        </p>
      )}
    </div>
  );
}
