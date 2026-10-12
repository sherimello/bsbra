import { LogoMark } from "@/components/site/logo";
import { Reveal } from "@/components/motion/reveal";
import { cn } from "@/lib/utils";

/** Centered, quiet card used by every sign-in and account page. */
export function AuthShell({
  title,
  lede,
  children,
  footer,
  wide,
}: {
  title: string;
  lede?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  wide?: boolean;
}) {
  return (
    <div className="bg-bg-subtle">
      <div className="mx-auto flex min-h-[calc(100dvh-var(--header-h))] w-full items-start justify-center px-4 py-16 sm:items-center sm:py-24">
        <Reveal y={16} className={cn("w-full", wide ? "max-w-xl" : "max-w-md")}>
          <div className="rounded-[var(--radius-tile)] bg-surface p-7 shadow-[var(--shadow-md)] hairline sm:p-10">
            <LogoMark className="mx-auto size-10 text-fg" />
            <h1 className="mt-6 text-center text-[1.75rem] leading-tight font-semibold tracking-[-0.025em]">{title}</h1>
            {lede && <p className="mt-2 text-center text-[0.9375rem] text-fg-subtle">{lede}</p>}
            <div className="mt-8">{children}</div>
          </div>
          {footer && <div className="mt-6 text-center text-[0.875rem] text-fg-subtle">{footer}</div>}
        </Reveal>
      </div>
    </div>
  );
}
