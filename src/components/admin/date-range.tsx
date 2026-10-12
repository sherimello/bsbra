import { withParams } from "@/components/ui/pagination";

/** Date range filter that preserves the other query parameters (works without JavaScript). */
export function DateRange({
  action,
  params,
  from,
  to,
}: {
  action: string;
  params: Record<string, string | undefined>;
  from?: string;
  to?: string;
}) {
  const hidden = Object.entries(params).filter(([k, v]) => v && k !== "from" && k !== "to");
  return (
    <form action={action} className="flex flex-wrap items-end gap-3 rounded-[var(--radius-card)] bg-surface p-3 hairline">
      {hidden.map(([k, v]) => (
        <input key={k} type="hidden" name={k} value={v} />
      ))}
      <label className="text-[0.75rem] text-fg-subtle">
        From
        <input type="date" name="from" defaultValue={from} className="mt-1 block h-10 rounded-xl bg-bg-subtle px-3 text-[0.875rem] text-fg hairline" />
      </label>
      <label className="text-[0.75rem] text-fg-subtle">
        To
        <input type="date" name="to" defaultValue={to} className="mt-1 block h-10 rounded-xl bg-bg-subtle px-3 text-[0.875rem] text-fg hairline" />
      </label>
      <button type="submit" className="press h-10 rounded-xl bg-fg px-4 text-[0.875rem] font-medium text-bg">
        Apply dates
      </button>
      {(from || to) && (
        <a href={withParams(action, { ...params, from: undefined, to: undefined })} className="h-10 px-2 text-[0.8125rem] leading-10 text-link hover:underline">
          Clear dates
        </a>
      )}
    </form>
  );
}
