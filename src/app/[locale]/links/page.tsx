import type { Metadata } from "next";
import { ArrowUpRight, Landmark } from "lucide-react";
import { getDictionary, resolveLocale } from "@/lib/i18n";
import { tr } from "@/lib/i18n/tr";
import { pageMetadata } from "@/lib/seo";
import { getLinks, getSiteSettings } from "@/lib/data/public";
import type { LinkCategory } from "@/lib/types";
import { PageHero } from "@/components/site/page-hero";
import { Container } from "@/components/ui/container";
import { ButtonLink } from "@/components/ui/button";
import { Reveal, RevealGroup, RevealItem } from "@/components/motion/reveal";

export async function generateMetadata({ params }: PageProps<"/[locale]/links">): Promise<Metadata> {
  const locale = await resolveLocale(params);
  const t = getDictionary(locale);
  return pageMetadata({ locale, path: "/links", title: t.nav.links, description: t.links.lede });
}

const ORDER: LinkCategory[] = ["regulatory", "government", "environmental", "safety", "international", "ship_recycling", "institution", "association"];

function hostname(url: string) {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

export default async function LinksPage({ params }: PageProps<"/[locale]/links">) {
  const locale = await resolveLocale(params);
  const t = getDictionary(locale);
  const [links, settings] = await Promise.all([getLinks(), getSiteSettings()]);
  const featured = links.filter((l) => l.is_featured);
  const rest = links.filter((l) => !l.is_featured);

  return (
    <>
      <PageHero eyebrow={t.links.eyebrow} title={t.links.title} lede={t.links.lede} />
      <Container className="pb-24">
        {featured.map((link) => (
          <Reveal key={link.id} className="mb-16">
            <div className="rounded-[var(--radius-tile)] bg-bg-subtle p-8 sm:p-12">
              <div className="flex flex-col gap-8 md:flex-row md:items-end md:justify-between">
                <div className="max-w-2xl">
                  <Landmark className="size-7 text-fg-subtle" strokeWidth={1.5} />
                  <p className="text-eyebrow mt-6 text-fg-subtle">{t.links.featured}</p>
                  <h2 className="text-title mt-2">{tr(link, "title", locale)}</h2>
                  {link.description_en && <p className="mt-3 text-fg-subtle">{tr(link, "description", locale)}</p>}
                </div>
                <ButtonLink href={settings.bsrb_url && link.title_en.includes("BSRB") ? settings.bsrb_url : link.url} external>
                  {t.links.visit}
                  <ArrowUpRight />
                </ButtonLink>
              </div>
            </div>
          </Reveal>
        ))}

        <div className="space-y-14">
          {ORDER.map((category) => {
            const group = rest.filter((l) => l.category === category);
            if (!group.length) return null;
            return (
              <section key={category}>
                <Reveal>
                  <h2 className="mb-5 text-[1.25rem] font-semibold tracking-[-0.02em]">{t.labels.linkCategory[category]}</h2>
                </Reveal>
                <RevealGroup className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {group.map((link) => (
                    <RevealItem key={link.id}>
                      <a
                        href={link.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="group press flex h-full flex-col justify-between gap-4 rounded-[var(--radius-card)] bg-surface p-5 hairline transition-shadow duration-500 hover:shadow-[var(--shadow-md)]"
                      >
                        <div>
                          <div className="flex items-start justify-between gap-3">
                            <h3 className="text-[1rem] leading-snug font-semibold text-fg group-hover:text-link">{tr(link, "title", locale)}</h3>
                            <ArrowUpRight className="size-4 shrink-0 text-fg-faint transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-fg" />
                          </div>
                          {link.description_en && <p className="mt-1.5 text-[0.875rem] text-fg-subtle">{tr(link, "description", locale)}</p>}
                        </div>
                        <p className="text-[0.75rem] text-fg-faint">{hostname(link.url)}</p>
                      </a>
                    </RevealItem>
                  ))}
                </RevealGroup>
              </section>
            );
          })}
        </div>
      </Container>
    </>
  );
}
