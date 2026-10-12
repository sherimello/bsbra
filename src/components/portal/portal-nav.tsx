"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

export function PortalNav({ items, className }: { items: { label: string; href: string }[]; className?: string }) {
  const pathname = usePathname();
  // The overview is the shortest href; match it exactly so it isn't active everywhere.
  const overview = items[0]?.href;
  return (
    <nav aria-label="Portal" className={cn("-mx-4 overflow-x-auto px-4 scrollbar-none sm:mx-0 sm:px-0", className)}>
      <ul className="flex w-max gap-1 rounded-full bg-bg p-1 hairline">
        {items.map((item) => {
          const active = item.href === overview ? pathname === item.href : pathname.startsWith(item.href);
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "press inline-flex h-9 items-center rounded-full px-4 text-[0.875rem] font-medium whitespace-nowrap transition-colors",
                  active ? "bg-fg text-bg" : "text-fg-muted hover:text-fg",
                )}
              >
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
