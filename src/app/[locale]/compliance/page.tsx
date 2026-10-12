import type { Metadata } from "next";
import { getDictionary, href, resolveLocale } from "@/lib/i18n";
import { tr } from "@/lib/i18n/tr";
import { pageMetadata } from "@/lib/seo";
import { getComplianceItems, getPage } from "@/lib/data/public";
import type { ComplianceCategory } from "@/lib/types";
import { PageHero } from "@/components/site/page-hero";
import { CmsSections } from "@/components/site/cms-sections";
import { ComplianceCard } from "@/components/site/compliance-card";
import { Section, SectionHeading } from "@/components/ui/section";
import { ButtonLink } from "@/components/ui/button";
import { RevealGroup, RevealItem } from "@/components/motion/reveal";

export async function generateMetadata({ params }: PageProps<"/[locale]/compliance">): Promise<Metadata> {
  const locale = await resolveLocale(params);
  const t = getDictionary(locale);
  return pageMetadata({ locale, path: "/compliance", title: t.nav.compliance, description: t.compliance.lede });
}

const ORDER: ComplianceCategory[] = [
  "international_convention",
  "national_law",
  "green_facility",
  "environmental",
  "ship_recycling",
  "ohs",
  "waste",
  "initiative",
];

export default async function CompliancePage({ params }: PageProps<"/[locale]/compliance">) {
  const locale = await resolveLocale(params);
  const t = getDictionary(locale);
  const [overview, items] = await Promise.all([getPage("compliance-overview"), getComplianceItems()]);

  return (
    <>
      <PageHero eyebrow={t.compliance.eyebrow} title={t.compliance.title} lede={t.compliance.lede}>
        <ButtonLink href={href(locale, "/compliance/our-compliances")}>{t.compliance.viewOurs}</ButtonLink>
      </PageHero>

      {overview && <CmsSections body={tr(overview, "body", locale)} locale={locale} className="pt-0 sm:pt-4" onThisPage={t.common.onThisPage} />}

      {ORDER.map((category, i) => {
        const group = items.filter((item) => item.category === category);
        if (!group.length) return null;
        return (
          <Section key={category} id={category} tone={i % 2 === 0 ? "subtle" : "default"}>
            <SectionHeading title={t.compliance.groups[category]} />
            <RevealGroup className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {group.map((item) => (
                <RevealItem key={item.id}>
                  <ComplianceCard item={item} locale={locale} t={t} />
                </RevealItem>
              ))}
            </RevealGroup>
          </Section>
        );
      })}
    </>
  );
}
