import { cn } from "@/lib/utils";
import { Container } from "@/components/ui/container";
import { Reveal } from "@/components/motion/reveal";

/** Opening block for inner pages: eyebrow, large title and lede on a quiet ground. */
export function PageHero({
  eyebrow,
  title,
  lede,
  children,
  className,
  tone = "default",
  align = "left",
}: {
  eyebrow?: string;
  title: string;
  lede?: string | null;
  children?: React.ReactNode;
  className?: string;
  /** "ink" is kept for compatibility and renders as a soft grey band. */
  tone?: "default" | "subtle" | "ink";
  align?: "left" | "center";
}) {
  return (
    <section className={cn("relative", tone === "default" ? "bg-bg" : "bg-bg-subtle", className)}>
      <Container className={cn("pt-16 pb-14 sm:pt-24 sm:pb-20", align === "center" && "text-center")}>
        <Reveal y={20}>
          {eyebrow && <p className="text-eyebrow mb-5 text-fg-subtle">{eyebrow}</p>}
          <h1 className={cn("text-page-title max-w-4xl text-balance", align === "center" && "mx-auto")}>{title}</h1>
          {lede && (
            <p className={cn("text-lede mt-6 max-w-2xl text-pretty text-fg-subtle", align === "center" && "mx-auto")}>
              {lede}
            </p>
          )}
        </Reveal>
        {children && (
          <Reveal y={16} delay={0.08} className="mt-10">
            {children}
          </Reveal>
        )}
      </Container>
    </section>
  );
}
