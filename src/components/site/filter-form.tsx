"use client";

import Form from "next/form";
import { useRef } from "react";
import { Search, X } from "lucide-react";
import { cn } from "@/lib/utils";

export interface FilterSelect {
  name: string;
  label: string;
  value: string;
  options: { value: string; label: string }[];
}

/**
 * GET filter bar. Works without JavaScript (plain form submit); with it,
 * selects apply instantly and navigation stays client-side via next/form.
 */
export function FilterForm({
  action,
  search,
  selects,
  labels,
  className,
}: {
  action: string;
  search?: { name: string; value: string; placeholder: string };
  selects: FilterSelect[];
  labels: { apply: string; clear: string; search: string };
  className?: string;
}) {
  const formRef = useRef<HTMLFormElement>(null);
  const hasFilters = (search?.value ?? "") !== "" || selects.some((s) => s.value !== "");

  return (
    <Form
      ref={formRef}
      action={action}
      scroll={false}
      className={cn("flex flex-col gap-3 rounded-[var(--radius-card)] bg-bg-subtle p-3 lg:flex-row lg:items-center", className)}
      role="search"
    >
      {search && (
        <label className="relative flex-1">
          <span className="sr-only">{labels.search}</span>
          <Search className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-fg-subtle" />
          <input
            type="search"
            name={search.name}
            defaultValue={search.value}
            placeholder={search.placeholder}
            className="h-11 w-full rounded-xl bg-surface pr-3 pl-10 text-[0.9375rem] text-fg placeholder:text-fg-faint hairline focus:shadow-[0_0_0_4px_var(--brand-ring),inset_0_0_0_1px_var(--brand)] focus:outline-none"
            enterKeyHint="search"
          />
        </label>
      )}
      <div className="grid grid-cols-2 gap-3 sm:flex sm:flex-wrap">
        {selects.map((s) => (
          <label key={s.name} className="relative min-w-0 sm:w-44">
            <span className="sr-only">{s.label}</span>
            <select
              name={s.name}
              defaultValue={s.value}
              onChange={() => formRef.current?.requestSubmit()}
              className={cn(
                "h-11 w-full appearance-none truncate rounded-xl bg-surface pr-9 pl-3.5 text-[0.9375rem] hairline focus:shadow-[0_0_0_4px_var(--brand-ring),inset_0_0_0_1px_var(--brand)] focus:outline-none",
                s.value ? "text-fg" : "text-fg-muted",
              )}
            >
              {s.options.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
            <svg aria-hidden viewBox="0 0 16 16" className="pointer-events-none absolute top-1/2 right-3 size-3.5 -translate-y-1/2 text-fg-subtle">
              <path d="M4 6l4 4 4-4" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </label>
        ))}
      </div>
      <div className="flex gap-2">
        <button type="submit" className="press h-11 flex-1 rounded-xl bg-fg px-5 text-[0.9375rem] font-medium text-bg lg:flex-none">
          {labels.apply}
        </button>
        {hasFilters && (
          <a
            href={action}
            className="press grid h-11 w-11 place-items-center rounded-xl text-fg-subtle hairline hover:text-fg"
            aria-label={labels.clear}
            title={labels.clear}
          >
            <X className="size-4" />
          </a>
        )}
      </div>
    </Form>
  );
}
