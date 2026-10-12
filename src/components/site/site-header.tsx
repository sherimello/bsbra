"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useId, useRef, useState } from "react";
import { AnimatePresence, m } from "motion/react";
import { ChevronRight, Search } from "lucide-react";
import type { NavGroup } from "@/lib/navigation";
import type { Locale } from "@/lib/i18n/config";
import { cn } from "@/lib/utils";
import { spring } from "@/components/motion/springs";
import { Logo } from "./logo";
import { LanguageSwitch } from "./language-switch";
import { SearchDialog, type SearchLabels } from "./search-dialog";
import { ThemeToggle } from "@/components/theme/theme-toggle";

export interface HeaderLabels {
  home: string;
  menu: string;
  close: string;
  search: string;
  language: string;
  skipToContent: string;
  siteName: string;
  themeLight: string;
  themeDark: string;
  appearance: string;
}

export function SiteHeader({
  locale,
  groups,
  labels,
  searchLabels,
  quickLinks,
  account,
}: {
  locale: Locale;
  groups: NavGroup[];
  labels: HeaderLabels;
  searchLabels: SearchLabels;
  quickLinks: { label: string; href: string }[];
  account: React.ReactNode;
}) {
  const pathname = usePathname();
  const [openGroup, setOpenGroup] = useState<string | null>(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const intentTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const flyoutId = useId();

  // Close everything when the route changes.
  const [lastPath, setLastPath] = useState(pathname);
  if (pathname !== lastPath) {
    setLastPath(pathname);
    setOpenGroup(null);
    setMobileOpen(false);
    setSearchOpen(false);
  }

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 4);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (!mobileOpen) return;
    const original = document.documentElement.style.overflow;
    document.documentElement.style.overflow = "hidden";
    return () => {
      document.documentElement.style.overflow = original;
    };
  }, [mobileOpen]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpenGroup(null);
        setMobileOpen(false);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const clearIntent = () => {
    if (intentTimer.current) clearTimeout(intentTimer.current);
    intentTimer.current = null;
  };

  // Hover intent: open after a short pause, switch instantly once a panel is open.
  const hoverGroup = useCallback(
    (id: string) => {
      clearIntent();
      if (openGroup) setOpenGroup(id);
      else intentTimer.current = setTimeout(() => setOpenGroup(id), 110);
    },
    [openGroup],
  );

  const leaveHeader = () => {
    clearIntent();
    intentTimer.current = setTimeout(() => setOpenGroup(null), 160);
  };

  const active = groups.find((g) => g.id === openGroup);
  const isCurrent = (href: string) => pathname === href || pathname.startsWith(`${href}/`);

  return (
    <>
      <a
        href="#main"
        className="fixed top-2 left-2 z-[70] -translate-y-20 rounded-full bg-fg px-4 py-2 text-sm text-bg transition-transform focus:translate-y-0"
      >
        {labels.skipToContent}
      </a>

      <header
        className="sticky top-0 z-50"
        onMouseLeave={leaveHeader}
        onMouseEnter={clearIntent}
      >
        <div
          className={cn(
            "relative z-10 transition-[background-color,box-shadow] duration-300",
            openGroup || mobileOpen ? "glass-strong" : "glass",
            scrolled && !openGroup && !mobileOpen && "shadow-[0_1px_0_var(--line)]",
          )}
        >
          <div className="mx-auto flex h-[var(--header-h)] max-w-[1180px] items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
            <Link href={`/${locale}`} className="press -ml-1 rounded-lg p-1" aria-label={labels.home}>
              <Logo label={labels.siteName} />
            </Link>

            <nav aria-label="Primary" className="hidden lg:block">
              <ul className="flex items-center gap-1">
                {groups.map((group) => {
                  const current = group.items.some((i) => isCurrent(i.href));
                  return (
                    <li key={group.id}>
                      <button
                        type="button"
                        aria-expanded={openGroup === group.id}
                        aria-controls={flyoutId}
                        onMouseEnter={() => hoverGroup(group.id)}
                        onFocus={() => hoverGroup(group.id)}
                        onClick={() => setOpenGroup((g) => (g === group.id ? null : group.id))}
                        className={cn(
                          "rounded-full px-3.5 py-1.5 text-[0.8125rem] tracking-[-0.01em] transition-colors duration-200",
                          openGroup === group.id || current ? "text-fg" : "text-fg-muted hover:text-fg",
                          current && "font-medium",
                        )}
                      >
                        {group.label}
                      </button>
                    </li>
                  );
                })}
              </ul>
            </nav>

            <div className="flex items-center gap-0.5">
              <button
                type="button"
                onClick={() => setSearchOpen(true)}
                className="press grid size-9 place-items-center rounded-full text-fg-muted transition-colors hover:text-fg"
                aria-label={labels.search}
              >
                <Search className="size-[1.0625rem]" strokeWidth={1.8} />
              </button>
              <LanguageSwitch locale={locale} label={labels.language} />
              <ThemeToggle labels={{ light: labels.themeLight, dark: labels.themeDark }} className="hidden sm:grid" />
              {account}
              <button
                type="button"
                className="press grid size-9 place-items-center rounded-full lg:hidden"
                aria-expanded={mobileOpen}
                aria-label={mobileOpen ? labels.close : labels.menu}
                onClick={() => setMobileOpen((v) => !v)}
              >
                <span className="relative block h-3 w-[18px]">
                  <span
                    className={cn(
                      "absolute left-0 block h-[1.5px] w-full rounded-full bg-fg transition-transform duration-300 ease-[var(--ease-out-quint)]",
                      mobileOpen ? "top-[5px] rotate-45" : "top-0.5",
                    )}
                  />
                  <span
                    className={cn(
                      "absolute left-0 block h-[1.5px] w-full rounded-full bg-fg transition-transform duration-300 ease-[var(--ease-out-quint)]",
                      mobileOpen ? "top-[5px] -rotate-45" : "top-[9px]",
                    )}
                  />
                </span>
              </button>
            </div>
          </div>

          {/* Desktop flyout */}
          <AnimatePresence initial={false}>
            {active && (
              <m.div
                key="flyout"
                id={flyoutId}
                initial={{ height: 0 }}
                animate={{ height: "auto" }}
                exit={{ height: 0 }}
                transition={spring.ui}
                className="hidden overflow-hidden lg:block"
              >
                <AnimatePresence mode="popLayout" initial={false}>
                  <m.div
                    key={active.id}
                    initial={{ opacity: 0, y: -6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    transition={spring.snappy}
                    className="mx-auto grid max-w-[1180px] grid-cols-12 gap-8 px-8 pt-8 pb-12"
                  >
                    <p className="col-span-12 text-[0.75rem] font-medium text-fg-faint">{active.label}</p>
                    <ul className="col-span-12 grid grid-cols-3 gap-x-10 gap-y-6">
                      {active.items.map((item, i) => (
                        <m.li
                          key={item.href}
                          initial={{ opacity: 0, y: 6 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ ...spring.ui, delay: 0.025 * i }}
                        >
                          <Link href={item.href} className="group block">
                            <span className="flex items-center gap-1 text-[1.375rem] leading-tight font-semibold tracking-[-0.022em] text-fg">
                              {item.label}
                              <ChevronRight className="size-4 -translate-x-1 opacity-0 transition-all duration-300 group-hover:translate-x-0 group-hover:opacity-100" />
                            </span>
                            {item.description && (
                              <span className="mt-1 block text-[0.8125rem] leading-snug text-fg-subtle">{item.description}</span>
                            )}
                          </Link>
                        </m.li>
                      ))}
                    </ul>
                  </m.div>
                </AnimatePresence>
              </m.div>
            )}
          </AnimatePresence>
        </div>

        {/* Page dim behind the flyout */}
        <AnimatePresence>
          {active && (
            <m.div
              key="scrim"
              aria-hidden
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
              className="fixed inset-0 top-0 -z-0 hidden bg-black/10 backdrop-blur-[10px] lg:block"
              onMouseEnter={leaveHeader}
              onClick={() => setOpenGroup(null)}
            />
          )}
        </AnimatePresence>

        {/* Mobile menu */}
        <AnimatePresence>
          {mobileOpen && (
            <m.div
              key="mobile"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="glass-strong fixed inset-x-0 top-[var(--header-h)] bottom-0 overflow-y-auto overscroll-contain lg:hidden"
            >
              <nav aria-label="Mobile" className="px-6 pt-4 pb-16">
                {groups.map((group, gi) => (
                  <m.section
                    key={group.id}
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ ...spring.ui, delay: 0.03 * gi }}
                    className="border-b border-line py-5 last:border-0"
                  >
                    <p className="mb-2 text-[0.75rem] font-medium text-fg-faint">{group.label}</p>
                    <ul>
                      {group.items.map((item) => (
                        <li key={item.href}>
                          <Link
                            href={item.href}
                            className={cn(
                              "block py-1.5 text-[1.5rem] leading-tight font-semibold tracking-[-0.022em]",
                              isCurrent(item.href) ? "text-fg-subtle" : "text-fg",
                            )}
                          >
                            {item.label}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </m.section>
                ))}
                <div className="flex items-center justify-between pt-6 text-[0.875rem] text-fg-subtle sm:hidden">
                  <span>{labels.appearance}</span>
                  <ThemeToggle labels={{ light: labels.themeLight, dark: labels.themeDark }} className="bg-bg-muted" />
                </div>
              </nav>
            </m.div>
          )}
        </AnimatePresence>
      </header>

      <SearchDialog
        open={searchOpen}
        onOpenChange={setSearchOpen}
        locale={locale}
        labels={searchLabels}
        quickLinks={quickLinks}
      />
    </>
  );
}
