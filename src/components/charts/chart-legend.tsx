import type { Series } from "./chart-utils";

/** Legend for two or more series — identity never relies on colour alone. */
export function ChartLegend({ series, kind = "swatch" }: { series: Series[]; kind?: "swatch" | "line" }) {
  if (series.length < 2) return null;
  return (
    <ul className="flex flex-wrap gap-x-5 gap-y-2 text-[0.8125rem] text-fg-muted">
      {series.map((s) => (
        <li key={s.key} className="inline-flex items-center gap-2">
          {kind === "line" ? (
            <span aria-hidden className="h-0.5 w-4 rounded-full" style={{ background: s.color }} />
          ) : (
            <span aria-hidden className="size-2.5 rounded-[3px]" style={{ background: s.color }} />
          )}
          {s.label}
        </li>
      ))}
    </ul>
  );
}

export function ChartTooltip({
  x,
  y,
  title,
  rows,
  containerWidth,
}: {
  x: number;
  y: number;
  title: string;
  rows: { label: string; value: string; color: string }[];
  containerWidth: number;
}) {
  const flip = x > containerWidth - 180;
  return (
    <div
      role="status"
      className="pointer-events-none absolute z-10 min-w-36 rounded-xl bg-surface-raised px-3 py-2.5 text-[0.8125rem] shadow-[var(--shadow-lg)] hairline"
      style={{ left: x, top: y, transform: `translate(${flip ? "calc(-100% - 12px)" : "12px"}, -50%)` }}
    >
      <p className="mb-1.5 font-semibold text-fg tabular">{title}</p>
      <ul className="space-y-1">
        {rows.map((r) => (
          <li key={r.label} className="flex items-center justify-between gap-4 text-fg-muted">
            <span className="inline-flex items-center gap-1.5">
              <span aria-hidden className="size-2 rounded-full" style={{ background: r.color }} />
              {r.label}
            </span>
            <span className="font-medium text-fg tabular">{r.value}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
