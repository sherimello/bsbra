"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { AnimatePresence, m } from "motion/react";
import { ArrowRight, Search } from "lucide-react";
import type { Locale } from "@/lib/i18n/config";
import { spring } from "@/components/motion/springs";

export interface SearchLabels {
  placeholder: string;
  hint: string;
  shortcut: string;
  quickLinks: string;
  close: string;
}

/** Spotlight-style search: press “/” or ⌘K anywhere. */
export function SearchDialog({
  open,
  onOpenChange,
  locale,
  labels,
  quickLinks,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  locale: Locale;
  labels: SearchLabels;
  quickLinks: { label: string; href: string }[];
}) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState("");

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const typing = target && (target.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName));
      if ((e.key === "k" && (e.metaKey || e.ctrlKey)) || (e.key === "/" && !typing)) {
        e.preventDefault();
        onOpenChange(true);
      } else if (e.key === "Escape" && open) {
        onOpenChange(false);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onOpenChange]);

  useEffect(() => {
    if (open) requestAnimationFrame(() => inputRef.current?.focus());
  }, [open]);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const q = query.trim();
    if (!q) return;
    onOpenChange(false);
    router.push(`/${locale}/search?q=${encodeURIComponent(q)}`);
  };

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[60]" role="dialog" aria-modal="true" aria-label={labels.placeholder}>
          <m.button
            type="button"
            aria-label={labels.close}
            className="absolute inset-0 h-full w-full cursor-default bg-black/30 backdrop-blur-[8px]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={() => onOpenChange(false)}
          />
          <m.div
            initial={{ opacity: 0, y: -12, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.98 }}
            transition={spring.ui}
            className="glass-strong relative mx-auto mt-[12vh] w-[calc(100%-2rem)] max-w-xl overflow-hidden rounded-3xl shadow-[var(--shadow-lg)] hairline"
          >
            <form onSubmit={submit} className="flex items-center gap-3 border-b border-line px-5">
              <Search className="size-5 shrink-0 text-fg-subtle" strokeWidth={1.8} />
              <input
                ref={inputRef}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={labels.placeholder}
                className="h-16 w-full bg-transparent text-[1.25rem] tracking-[-0.02em] text-fg placeholder:text-fg-faint focus:outline-none"
                enterKeyHint="search"
                aria-label={labels.placeholder}
              />
              <kbd className="hidden rounded-md bg-bg-muted px-1.5 py-0.5 text-[0.6875rem] text-fg-subtle sm:block">esc</kbd>
            </form>
            <div className="px-5 py-4">
              <p className="mb-2 text-[0.75rem] font-medium text-fg-faint">{labels.quickLinks}</p>
              <ul className="-mx-2">
                {quickLinks.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      onClick={() => onOpenChange(false)}
                      className="group flex items-center justify-between rounded-xl px-2 py-2 text-[0.9375rem] text-fg-muted transition-colors hover:bg-bg-muted hover:text-fg"
                    >
                      {link.label}
                      <ArrowRight className="size-4 opacity-0 transition-opacity group-hover:opacity-60" />
                    </Link>
                  </li>
                ))}
              </ul>
              <p className="mt-3 text-[0.75rem] text-fg-faint">{labels.hint}</p>
            </div>
          </m.div>
        </div>
      )}
    </AnimatePresence>
  );
}
