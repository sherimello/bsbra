import { Container } from "@/components/ui/container";
import { Markdown, splitMarkdownSections } from "@/components/ui/markdown";
import { Reveal } from "@/components/motion/reveal";
import { localizeDigits } from "@/lib/i18n/format";
import type { Locale } from "@/lib/i18n/config";
import { cn } from "@/lib/utils";

/**
 * Renders a CMS page body as a sequence of animated sections — one per
 * “## heading” — with a numbered, sticky title column on large screens.
 * Editors control the structure entirely from Markdown.
 */
export function CmsSections({
  body,
  locale,
  className,
  onThisPage,
}: {
  body: string | null | undefined;
  locale: Locale;
  className?: string;
  onThisPage?: string;
}) {
  const { intro, sections } = splitMarkdownSections(body);
  if (!intro && sections.length === 0) return null;

  return (
    <div className={cn("py-16 sm:py-24", className)}>
      <Container>
        {intro && (
          <Reveal className="mb-16 max-w-3xl">
            <Markdown className="text-lede">{intro}</Markdown>
          </Reveal>
        )}

        {sections.length > 2 && onThisPage && (
          <Reveal as="div" className="mb-16 hidden rounded-[var(--radius-card)] bg-bg-subtle p-6 md:block">
            <p className="mb-3 text-[0.75rem] font-medium text-fg-faint">{onThisPage}</p>
            <ol className="grid grid-cols-2 gap-x-8 gap-y-2 lg:grid-cols-3">
              {sections.map((s, i) => (
                <li key={s.id}>
                  <a href={`#${s.id}`} className="group flex gap-3 text-[0.9375rem] text-fg-muted hover:text-fg">
                    <span className="w-6 shrink-0 text-fg-faint tabular">{localizeDigits(locale, String(i + 1).padStart(2, "0"))}</span>
                    <span className="group-hover:underline">{s.title}</span>
                  </a>
                </li>
              ))}
            </ol>
          </Reveal>
        )}

        <div className="divide-y divide-line border-t border-line">
          {sections.map((s, i) => (
            <section key={s.id} id={s.id} className="grid gap-6 py-12 sm:py-16 lg:grid-cols-[5fr_7fr] lg:gap-16">
              <Reveal className="lg:sticky lg:top-[calc(var(--header-h)+32px)] lg:self-start">
                <p className="mb-3 text-[0.8125rem] font-medium text-brand tabular">
                  {localizeDigits(locale, String(i + 1).padStart(2, "0"))}
                </p>
                <h2 className="text-title text-balance">{s.title}</h2>
              </Reveal>
              <Reveal delay={0.05}>
                <Markdown className="text-[1.0625rem] sm:text-[1.1875rem]">{s.body}</Markdown>
              </Reveal>
            </section>
          ))}
        </div>
      </Container>
    </div>
  );
}
