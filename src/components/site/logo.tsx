import { cn } from "@/lib/utils";

/**
 * BSBRA mark: a hull beneath a rising arc — a ship's second life.
 * Drawn in currentColor with the page background cut through it, so it
 * inverts cleanly between the light and dark themes.
 */
export function LogoMark({ className, title }: { className?: string; title?: string }) {
  return (
    <svg
      viewBox="0 0 32 32"
      className={cn("size-7", className)}
      role={title ? "img" : undefined}
      aria-hidden={title ? undefined : true}
    >
      {title && <title>{title}</title>}
      <rect width="32" height="32" rx="8" fill="currentColor" />
      <path d="M10.5 15.25a5.5 5.5 0 0 1 11 0" fill="none" className="stroke-bg" strokeWidth="1.9" strokeLinecap="round" />
      <path
        d="M6.5 18.25h19l-2.62 5.12a1.5 1.5 0 0 1-1.34.82H10.46a1.5 1.5 0 0 1-1.34-.82z"
        className="fill-bg"
      />
    </svg>
  );
}

export function Logo({ className, compact, label }: { className?: string; compact?: boolean; label: string }) {
  return (
    <span className={cn("flex items-center gap-2 text-fg", className)}>
      <LogoMark className="size-[1.625rem]" />
      <span className={cn("text-[1.0625rem] leading-none font-semibold tracking-[-0.02em]", compact && "sr-only")}>
        BSBRA
      </span>
      <span className="sr-only">{label}</span>
    </span>
  );
}
