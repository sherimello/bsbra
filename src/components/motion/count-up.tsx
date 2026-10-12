"use client";

import { useEffect, useRef } from "react";
import { animate, useReducedMotion } from "motion/react";
import { formatCompact, formatNumber } from "@/lib/i18n/format";
import { easeOutQuint } from "./springs";

/**
 * Renders the final value on the server (SEO, no-JS), then — if the number
 * starts below the fold — counts up from zero the first time it is seen.
 */
export function CountUp({
  value,
  locale,
  maximumFractionDigits = 0,
  compact = false,
  suffix = "",
  className,
}: {
  value: number;
  locale: "en" | "bn";
  maximumFractionDigits?: number;
  compact?: boolean;
  suffix?: string;
  className?: string;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const reduced = useReducedMotion();

  const format = (n: number) =>
    (compact ? formatCompact(locale, n) : formatNumber(locale, n, { maximumFractionDigits })) + suffix;

  useEffect(() => {
    const el = ref.current;
    if (!el || reduced) return;
    const rect = el.getBoundingClientRect();
    if (rect.top < window.innerHeight) return; // already visible: keep the static value

    el.textContent = format(0);
    let controls: ReturnType<typeof animate> | undefined;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        observer.disconnect();
        controls = animate(0, value, {
          duration: 1.6,
          ease: easeOutQuint,
          onUpdate: (latest) => {
            el.textContent = format(maximumFractionDigits ? latest : Math.round(latest));
          },
        });
      },
      { rootMargin: "0px 0px -10% 0px" },
    );
    observer.observe(el);
    return () => {
      observer.disconnect();
      controls?.stop();
      el.textContent = format(value);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, locale, reduced]);

  return (
    <span ref={ref} className={className}>
      {format(value)}
    </span>
  );
}
