import type { Metadata } from "next";
import Image from "next/image";
import { ArrowUpRight } from "lucide-react";
import { getDictionary, resolveLocale } from "@/lib/i18n";
import { localizeDigits } from "@/lib/i18n/format";
import { pageMetadata } from "@/lib/seo";
import { photoList } from "@/lib/media/photos";
import { PageHero } from "@/components/site/page-hero";
import { Container } from "@/components/ui/container";
import { Reveal, RevealGroup, RevealItem } from "@/components/motion/reveal";

export async function generateMetadata({ params }: PageProps<"/[locale]/credits">): Promise<Metadata> {
  const locale = await resolveLocale(params);
  const t = getDictionary(locale);
  return pageMetadata({ locale, path: "/credits", title: t.credits.eyebrow, description: t.credits.lede });
}

export default async function CreditsPage({ params }: PageProps<"/[locale]/credits">) {
  const locale = await resolveLocale(params);
  const t = getDictionary(locale);
  const c = t.credits;
  return (
    <>
      <PageHero eyebrow={c.eyebrow} title={c.title} lede={c.lede} />

      <Container className="pb-20">
        <Reveal className="mb-8 max-w-2xl">
          <h2 className="text-title">{c.photosTitle}</h2>
          <p className="mt-3 text-fg-subtle">{c.photosNote}</p>
        </Reveal>
        <RevealGroup as="ul" className="grid gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
          {photoList.map((p) => (
            <RevealItem as="li" key={p.src}>
              <div id={p.src.split("/").pop()?.replace(/\.\w+$/, "")} className="scroll-mt-24">
                <div className="art-frame relative aspect-[4/3] rounded-[var(--radius-card)]">
                  <Image src={p.src} alt={locale === "bn" ? p.alt_bn : p.alt_en} fill sizes="(min-width: 1024px) 30vw, 50vw" className="object-cover" />
                </div>
                <p className="mt-4 text-[1rem] leading-snug font-semibold text-fg">{p.title}</p>
                <p className="mt-1 text-[0.875rem] text-fg-subtle">
                  {p.author}
                  {p.year ? ` · ${localizeDigits(locale, p.year)}` : ""}
                </p>
                <p className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-[0.8125rem]">
                  {p.licenseUrl ? (
                    <a href={p.licenseUrl} target="_blank" rel="noopener noreferrer license" className="text-link hover:underline">
                      {p.license}
                    </a>
                  ) : (
                    <span className="text-fg-subtle">{p.license}</span>
                  )}
                  <a href={p.sourceUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-0.5 text-link hover:underline">
                    {c.view}
                    <ArrowUpRight className="size-3.5" />
                  </a>
                </p>
              </div>
            </RevealItem>
          ))}
        </RevealGroup>
      </Container>

      <div className="bg-bg-subtle">
        <Container className="grid gap-16 py-20 lg:grid-cols-[2fr_1fr] lg:gap-20">
          <div>
            <Reveal>
              <h2 className="text-title">{c.dataTitle}</h2>
            </Reveal>
            <ul className="mt-8 divide-y divide-line border-y border-line">
              {c.sources.map((s) => (
                <li key={s.name} className="py-5">
                  <a href={s.url} target="_blank" rel="noopener noreferrer" className="group block">
                    <span className="flex items-center gap-1 font-semibold text-fg group-hover:text-link">
                      {s.name}
                      <ArrowUpRight className="size-4 opacity-50" />
                    </span>
                    <span className="mt-1 block text-[0.9375rem] text-fg-subtle">{s.detail}</span>
                  </a>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <Reveal>
              <h2 className="text-title">{c.typeTitle}</h2>
            </Reveal>
            <p className="mt-8 text-[0.9375rem] text-fg-subtle">{c.typeface}</p>
          </div>
        </Container>
      </div>
    </>
  );
}
