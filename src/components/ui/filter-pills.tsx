import Link from "next/link";
import { cn } from "@/lib/utils";

/** A horizontally scrolling row of filter links — the segmented style Apple uses for categories. */
export function FilterPills({
  items,
  className,
  label,
}: {
  items: { label: string; href: string; active: boolean; count?: number }[];
  className?: string;
  label: string;
}) {
  return (
    <nav aria-label={label} className={cn("-mx-4 overflow-x-auto px-4 scrollbar-none sm:mx-0 sm:px-0", className)}>
      <ul className="flex w-max gap-2">
        {items.map((item) => (
          <li key={item.href}>
            <Link
              href={item.href}
              scroll={false}
              aria-current={item.active ? "true" : undefined}
              className={cn(
                "press inline-flex h-9 items-center gap-1.5 rounded-full px-4 text-[0.875rem] font-medium whitespace-nowrap transition-colors duration-200",
                item.active ? "bg-fg text-bg" : "bg-bg-muted text-fg-muted hover:text-fg",
              )}
            >
              {item.label}
              {item.count !== undefined && <span className="tabular opacity-60">{item.count}</span>}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
