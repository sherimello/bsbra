import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

/** Builds a URL that keeps the current filters and swaps one parameter. */
export function withParams(path: string, params: Record<string, string | number | null | undefined>) {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== null && value !== undefined && value !== "") search.set(key, String(value));
  }
  const qs = search.toString();
  return qs ? `${path}?${qs}` : path;
}

export function Pagination({
  path,
  params,
  page,
  totalPages,
  labels,
}: {
  path: string;
  params: Record<string, string | number | null | undefined>;
  page: number;
  totalPages: number;
  labels: { previous: string; next: string; page: string; of: string };
}) {
  if (totalPages <= 1) return null;
  const href = (p: number) => withParams(path, { ...params, page: p === 1 ? null : p });
  const pages = Array.from({ length: totalPages }, (_, i) => i + 1).filter(
    (p) => p === 1 || p === totalPages || Math.abs(p - page) <= 1,
  );

  const item = "press inline-flex h-9 min-w-9 items-center justify-center rounded-full px-3 text-[0.875rem] font-medium tabular";

  return (
    <nav aria-label={labels.page} className="mt-12 flex items-center justify-center gap-1.5">
      {page > 1 ? (
        <Link href={href(page - 1)} className={cn(item, "hover:bg-bg-muted")} aria-label={labels.previous}>
          <ChevronLeft className="size-4" />
        </Link>
      ) : (
        <span className={cn(item, "opacity-30")} aria-hidden>
          <ChevronLeft className="size-4" />
        </span>
      )}
      {pages.map((p, i) => (
        <span key={p} className="flex items-center gap-1.5">
          {i > 0 && p - pages[i - 1] > 1 && <span className="px-1 text-fg-faint">…</span>}
          <Link
            href={href(p)}
            aria-current={p === page ? "page" : undefined}
            className={cn(item, p === page ? "bg-fg text-bg" : "hover:bg-bg-muted")}
          >
            {p}
          </Link>
        </span>
      ))}
      {page < totalPages ? (
        <Link href={href(page + 1)} className={cn(item, "hover:bg-bg-muted")} aria-label={labels.next}>
          <ChevronRight className="size-4" />
        </Link>
      ) : (
        <span className={cn(item, "opacity-30")} aria-hidden>
          <ChevronRight className="size-4" />
        </span>
      )}
    </nav>
  );
}
