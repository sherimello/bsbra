import type { Metadata } from "next";
import { Mail, Phone } from "lucide-react";
import { getDictionary, resolveLocale } from "@/lib/i18n";
import { tr } from "@/lib/i18n/tr";
import { localizeDigits } from "@/lib/i18n/format";
import { mediaUrl } from "@/lib/env";
import { pageMetadata } from "@/lib/seo";
import { getCommittee, getPastPresidents } from "@/lib/data/public";
import type { CommitteeMember } from "@/lib/types";
import { PageHero } from "@/components/site/page-hero";
import { Section, SectionHeading } from "@/components/ui/section";
import { EmptyState } from "@/components/ui/empty-state";
import { RevealGroup, RevealItem } from "@/components/motion/reveal";
import { initials } from "@/lib/utils";
import { AppImage } from "@/components/ui/app-image";

export async function generateMetadata({ params }: PageProps<"/[locale]/leadership">): Promise<Metadata> {
  const locale = await resolveLocale(params);
  const t = getDictionary(locale);
  return pageMetadata({ locale, path: "/leadership", title: t.nav.leadership, description: t.leadership.lede });
}

function Portrait({ name, photo, large }: { name: string; photo: string | null; large?: boolean }) {
  const url = mediaUrl(photo);
  return (
    <div
      className={
        large
          ? "relative aspect-[4/5] overflow-hidden rounded-[var(--radius-card)] bg-bg-subtle hairline"
          : "relative aspect-square overflow-hidden rounded-[var(--radius-card)] bg-bg-subtle hairline"
      }
    >
      {url ? (
        <AppImage src={url} alt={name} sizes="(min-width: 1024px) 25vw, 50vw" />
      ) : (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-b from-bg-subtle to-bg-muted p-4 text-center select-none">
          <span className="grid size-14 place-items-center rounded-full bg-surface text-base font-semibold tracking-tight text-fg-muted shadow-xs hairline">
            {initials(name)}
          </span>
          <span className="mt-2 text-[0.6875rem] font-semibold text-fg-faint uppercase tracking-widest">
            Executive
          </span>
        </div>
      )}
    </div>
  );
}

export default async function LeadershipPage({ params }: PageProps<"/[locale]/leadership">) {
  const locale = await resolveLocale(params);
  const t = getDictionary(locale);
  const l = t.leadership;
  const [committee, past] = await Promise.all([getCommittee(), getPastPresidents()]);
  const term = committee[0]?.term_label;

  const groups: { key: CommitteeMember["category"]; title: string }[] = [
    { key: "office_bearer", title: l.officeBearers },
    { key: "advisor", title: l.advisors },
    { key: "member", title: l.members },
  ];

  return (
    <>
      <PageHero eyebrow={l.eyebrow} title={l.title} lede={l.lede} />

      <Section className="pt-4 sm:pt-6">
        <div className="relative aspect-[16/9] sm:aspect-[21/9] overflow-hidden rounded-[var(--radius-tile)] bg-bg-subtle hairline">
          <AppImage
            src="/photos/bsbra-agm-committee.jpg"
            alt={locale === "bn" ? "বিএসবিআরএ বার্ষিক সাধারণ সভা ও কার্যনির্বাহী পরিষদ" : "BSBRA Executive Committee and Annual General Meeting in session"}
            priority
            sizes="(min-width: 1200px) 1180px, 100vw"
          />
        </div>
        <p className="mt-2.5 text-right text-[0.8125rem] text-fg-subtle">
          {locale === "bn"
            ? "রেডিসন ব্লু চট্টগ্রাম বে ভিউ-তে বিএসবিআরএ ৪০তম বার্ষিক সাধারণ সভা ও কার্যনির্বাহী কমিটির নেতৃবৃন্দ"
            : "BSBRA Executive Committee and members presiding at the 40th Annual General Meeting in Chattogram"}
        </p>

        <div className="mt-12 sm:mt-16">
          <SectionHeading
            eyebrow={term ? `${l.term} ${localizeDigits(locale, term)}` : undefined}
            title={l.current}
          />
        </div>
        {groups.map(({ key, title }) => {
          const people = committee.filter((m) => m.category === key);
          if (!people.length) return null;
          return (
            <div key={key} className="mb-16 last:mb-0">
              <h3 className="mb-6 text-[0.9375rem] font-semibold text-fg-subtle">{title}</h3>
              <RevealGroup className="grid grid-cols-2 gap-x-5 gap-y-10 md:grid-cols-3 lg:grid-cols-4">
                {people.map((person) => {
                  const name = tr(person, "name", locale);
                  return (
                    <RevealItem key={person.id}>
                      <article>
                        <Portrait name={name} photo={person.photo} large={key === "office_bearer"} />
                        <p className="mt-4 text-[0.8125rem] text-fg-subtle">{tr(person, "designation", locale)}</p>
                        <h4 className="mt-1 text-[1.1875rem] leading-snug font-semibold tracking-[-0.02em]">{name}</h4>
                        {person.organization_en && (
                          <p className="mt-1 text-[0.875rem] text-fg-subtle">{tr(person, "organization", locale)}</p>
                        )}
                        {person.bio_en && <p className="mt-2 line-clamp-4 text-[0.875rem] text-fg-subtle">{tr(person, "bio", locale)}</p>}
                        {person.show_contact && (person.email || person.phone) && (
                          <div className="mt-3 space-y-1 text-[0.8125rem]">
                            {person.email && (
                              <a href={`mailto:${person.email}`} className="flex items-center gap-1.5 text-link hover:underline">
                                <Mail className="size-3.5" />
                                {person.email}
                              </a>
                            )}
                            {person.phone && (
                              <a href={`tel:${person.phone}`} className="flex items-center gap-1.5 text-link hover:underline">
                                <Phone className="size-3.5" />
                                {person.phone}
                              </a>
                            )}
                          </div>
                        )}
                      </article>
                    </RevealItem>
                  );
                })}
              </RevealGroup>
            </div>
          );
        })}
      </Section>

      <Section tone="subtle" id="past-presidents">
        <SectionHeading title={l.pastPresidents} lede={l.pastPresidentsLede} />
        {past.length === 0 ? (
          <EmptyState title={t.common.comingSoon} body={l.pastEmpty} className="bg-bg" />
        ) : (
          <RevealGroup className="grid grid-cols-2 gap-5 md:grid-cols-4 lg:grid-cols-6">
            {past.map((p) => {
              const name = tr(p, "name", locale);
              return (
                <RevealItem key={p.id}>
                  <Portrait name={name} photo={p.photo} />
                  <h4 className="mt-3 text-[1rem] leading-snug font-semibold">{name}</h4>
                  <p className="text-[0.8125rem] text-fg-subtle tabular">
                    {localizeDigits(locale, [p.term_start, p.term_end].filter(Boolean).join("–"))}
                  </p>
                  {p.organization_en && <p className="text-[0.8125rem] text-fg-subtle">{tr(p, "organization", locale)}</p>}
                </RevealItem>
              );
            })}
          </RevealGroup>
        )}
      </Section>
    </>
  );
}
