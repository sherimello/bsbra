"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { AnimatePresence, m } from "motion/react";
import { ExternalLink, LogOut, Menu, X } from "lucide-react";
import type { Role } from "@/lib/types";
import { signOut } from "@/lib/auth/actions";
import { cn, initials } from "@/lib/utils";
import { LogoMark } from "@/components/site/logo";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { spring } from "@/components/motion/springs";

export interface AdminNavGroup {
  label: string;
  items: { label: string; href: string; badge?: number }[];
}

const ROLE_LABEL: Record<Role, string> = {
  super_admin: "Controlling Authority",
  admin: "Administrator",
  editor: "Editor",
  data_entry: "Data entry",
  committee: "Executive Committee",
  member: "Member",
  corporate: "Corporate",
  guest: "Pending",
};

export function AdminSidebar({
  groups,
  viewer,
  preview,
}: {
  groups: AdminNavGroup[];
  viewer: { name: string; email: string; role: Role };
  preview: boolean;
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [lastPath, setLastPath] = useState(pathname);
  if (pathname !== lastPath) {
    setLastPath(pathname);
    setOpen(false);
  }

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  const isActive = (href: string) => (href === "/admin" ? pathname === "/admin" : pathname === href || pathname.startsWith(`${href}/`));

  const nav = (
    <nav aria-label="Admin" className="flex-1 overflow-y-auto px-3 py-4">
      {groups.map((group) => (
        <div key={group.label} className="mb-5">
          <p className="mb-1 px-3 text-[0.6875rem] font-semibold tracking-wide text-fg-faint uppercase">{group.label}</p>
          <ul>
            {group.items.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  aria-current={isActive(item.href) ? "page" : undefined}
                  className={cn(
                    "flex items-center justify-between rounded-lg px-3 py-1.5 text-[0.875rem] transition-colors",
                    isActive(item.href) ? "bg-brand text-brand-fg" : "text-fg-muted hover:bg-bg-muted hover:text-fg",
                  )}
                >
                  {item.label}
                  {item.badge ? (
                    <span
                      className={cn(
                        "min-w-5 rounded-full px-1.5 text-center text-[0.6875rem] font-semibold tabular",
                        isActive(item.href) ? "bg-white/25" : "bg-danger text-white",
                      )}
                    >
                      {item.badge}
                    </span>
                  ) : null}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </nav>
  );

  const footer = (
    <div className="border-t border-line p-3">
      <Link href="/en" className="mb-1 flex items-center gap-2 rounded-lg px-3 py-1.5 text-[0.8125rem] text-fg-muted hover:bg-bg-muted hover:text-fg">
        <ExternalLink className="size-3.5" />
        View website
      </Link>
      <div className="flex items-center gap-3 rounded-xl px-3 py-2">
        <span className="grid size-8 shrink-0 place-items-center rounded-full bg-brand text-[0.6875rem] font-semibold text-brand-fg">
          {initials(viewer.name) || "•"}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-[0.8125rem] font-medium text-fg">{viewer.name}</span>
          <span className="block truncate text-[0.6875rem] text-fg-subtle">{ROLE_LABEL[viewer.role]}</span>
        </span>
        <ThemeToggle
          labels={{ light: "Switch to light appearance", dark: "Switch to dark appearance" }}
          className="size-8 text-fg-subtle hover:bg-bg-muted"
        />
        <form action={signOut}>
          <input type="hidden" name="locale" value="en" />
          <button type="submit" className="press grid size-8 place-items-center rounded-full text-fg-subtle hover:bg-bg-muted hover:text-fg" aria-label="Sign out" title="Sign out">
            <LogOut className="size-4" />
          </button>
        </form>
      </div>
    </div>
  );

  const brand = (
    <Link href="/admin" className="flex items-center gap-2.5 px-5 py-4">
      <LogoMark className="size-7 text-fg" />
      <span className="leading-tight">
        <span className="block text-[0.9375rem] font-semibold tracking-[-0.02em]">BSBRA</span>
        <span className="block text-[0.6875rem] text-fg-subtle">{preview ? "Admin · Preview" : "Admin"}</span>
      </span>
    </Link>
  );

  return (
    <>
      {/* Desktop */}
      <aside className="sticky top-0 hidden h-dvh w-64 shrink-0 flex-col border-r border-line bg-surface/70 backdrop-blur-xl lg:flex">
        {brand}
        {nav}
        {footer}
      </aside>

      {/* Mobile top bar */}
      <div className="glass sticky top-0 z-40 flex h-14 items-center justify-between border-b border-line px-4 lg:hidden">
        <Link href="/admin" className="flex items-center gap-2">
          <LogoMark className="size-7 text-fg" />
          <span className="text-[0.9375rem] font-semibold">BSBRA Admin</span>
        </Link>
        <button type="button" onClick={() => setOpen(true)} className="press grid size-10 place-items-center rounded-full" aria-label="Open menu">
          <Menu className="size-5" />
        </button>
      </div>
      <AnimatePresence>
        {open && (
          <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true">
            <m.button
              type="button"
              aria-label="Close menu"
              className="absolute inset-0 h-full w-full bg-black/30"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setOpen(false)}
            />
            <m.aside
              className="absolute inset-y-0 left-0 flex w-72 flex-col bg-surface shadow-[var(--shadow-lg)]"
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={spring.sheet}
            >
              <div className="flex items-center justify-between pr-3">
                {brand}
                <button type="button" onClick={() => setOpen(false)} className="press grid size-9 place-items-center rounded-full" aria-label="Close menu">
                  <X className="size-5" />
                </button>
              </div>
              {nav}
              {footer}
            </m.aside>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
