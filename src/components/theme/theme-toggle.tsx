"use client";

import { useSyncExternalStore } from "react";
import { AnimatePresence, m } from "motion/react";
import { Moon, Sun } from "lucide-react";
import { cn } from "@/lib/utils";
import { spring } from "@/components/motion/springs";
import { THEME_STORAGE_KEY } from "./theme-script";

type Theme = "light" | "dark";
const EVENT = "bsbra-theme-change";

function read(): Theme {
  return document.documentElement.dataset.theme === "dark" ? "dark" : "light";
}

function subscribe(onChange: () => void) {
  window.addEventListener(EVENT, onChange);
  window.addEventListener("storage", onChange);
  return () => {
    window.removeEventListener(EVENT, onChange);
    window.removeEventListener("storage", onChange);
  };
}

function apply(theme: Theme) {
  const root = document.documentElement;
  // Suppress colour transitions for one frame so the swap is clean.
  root.setAttribute("data-theme-switching", "");
  root.dataset.theme = theme;
  try {
    localStorage.setItem(THEME_STORAGE_KEY, theme);
  } catch {
    /* private mode — the choice simply isn't remembered */
  }
  window.dispatchEvent(new Event(EVENT));
  requestAnimationFrame(() => requestAnimationFrame(() => root.removeAttribute("data-theme-switching")));
}

export function useTheme() {
  const theme = useSyncExternalStore<Theme>(subscribe, read, () => "light");
  return { theme, setTheme: apply, toggle: () => apply(theme === "dark" ? "light" : "dark") };
}

/** Sun/moon button that switches between the light (default) and dark themes. */
export function ThemeToggle({
  labels,
  className,
}: {
  labels: { light: string; dark: string };
  className?: string;
}) {
  const { theme, toggle } = useTheme();
  const label = theme === "dark" ? labels.light : labels.dark;
  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={label}
      title={label}
      className={cn(
        "press relative grid size-9 place-items-center overflow-hidden rounded-full text-fg-muted transition-colors hover:text-fg",
        className,
      )}
    >
      <AnimatePresence initial={false} mode="popLayout">
        <m.span
          key={theme}
          initial={{ opacity: 0, rotate: -60, scale: 0.6 }}
          animate={{ opacity: 1, rotate: 0, scale: 1 }}
          exit={{ opacity: 0, rotate: 60, scale: 0.6 }}
          transition={spring.snappy}
          className="grid place-items-center"
        >
          {theme === "dark" ? (
            <Sun className="size-[1.0625rem]" strokeWidth={1.8} />
          ) : (
            <Moon className="size-[1rem]" strokeWidth={1.8} />
          )}
        </m.span>
      </AnimatePresence>
    </button>
  );
}
