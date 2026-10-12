import { cn } from "@/lib/utils";
import { Container } from "./container";
import { Reveal } from "@/components/motion/reveal";

export function Section({
  className,
  tone = "default",
  children,
  id,
  containerSize,
}: {
  className?: string;
  tone?: "default" | "subtle" | "ink";
  children: React.ReactNode;
  id?: string;
  containerSize?: "narrow" | "default" | "wide";
}) {
  return (
    <section
      id={id}
      className={cn(
        "py-24 sm:py-32",
        tone === "subtle" && "bg-bg-subtle",
        tone === "ink" && "bg-ink text-ink-fg",
        className,
      )}
    >
      <Container size={containerSize}>{children}</Container>
    </section>
  );
}

export function SectionHeading({
  eyebrow,
  title,
  lede,
  align = "left",
  className,
  action,
  tone = "default",
}: {
  eyebrow?: string;
  title: string;
  lede?: string | null;
  align?: "left" | "center";
  className?: string;
  action?: React.ReactNode;
  tone?: "default" | "ink";
}) {
  const muted = tone === "ink" ? "text-ink-muted" : "text-fg-subtle";
  return (
    <Reveal
      className={cn(
        "mb-14 flex flex-col gap-6 sm:mb-20",
        align === "center" ? "items-center text-center" : "md:flex-row md:items-end md:justify-between",
        className,
      )}
    >
      <div className={cn("max-w-3xl", align === "center" && "mx-auto")}>
        {eyebrow && <p className={cn("text-eyebrow mb-4", muted)}>{eyebrow}</p>}
        <h2 className="text-headline text-balance">{title}</h2>
        {lede && <p className={cn("text-lede mt-5 text-pretty", muted)}>{lede}</p>}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </Reveal>
  );
}
