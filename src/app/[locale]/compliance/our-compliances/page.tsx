import type { Metadata } from "next";
import { getDictionary, href, resolveLocale } from "@/lib/i18n";
import { tr } from "@/lib/i18n/tr";
import { formatNumber } from "@/lib/i18n/format";
import { pageMetadata } from "@/lib/seo";
import { getComplianceItems, getPage } from "@/lib/data/public";
import { PageHero } from "@/components/site/page-hero";
import { ComplianceCard } from "@/components/site/compliance-card";
import { Container } from "@/components/ui/container";
import { ArrowLink } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Reveal, RevealGroup, RevealItem } from "@/components/motion/reveal";

export async function generateMetadata({ params }: PageProps<"/[locale]/compliance/our-compliances">): Promise<Metadata> {
  const locale = await resolveLocale(params);
  const t = getDictionary(locale);
  return pageMetadata({ locale, path: "/compliance/our-compliances", title: t.nav.ourCompliances, description: t.compliance.ourLede });
}

export default async function OurCompliancesPage({ params }: PageProps<"/[locale]/compliance/our-compliances">) {
  const locale = await resolveLocale(params);
  const t = getDictionary(locale);
  const [page, items] = await Promise.all([getPage("our-compliances"), getComplianceItems()]);
  const ours = items.filter((i) => i.category === "our_compliance");
  const achieved = ours.filter((i) => i.status === "achieved").length;
  const progress = ours.filter((i) => i.status === "in_progress").length;

  return (
    <>
      <PageHero
        eyebrow={t.compliance.ourEyebrow}
        title={t.compliance.ourTitle}
        lede={page ? tr(page, "summary", locale) : t.compliance.ourLede}
      >
        {ours.length > 0 && (
          <dl className="flex flex-wrap gap-x-12 gap-y-6">
            {[
              { label: t.labels.complianceStatus.achieved, value: achieved },
              { label: t.labels.complianceStatus.in_progress, value: progress },
              { label: t.common.total, value: ours.length },
            ].map((s) => (
              <div key={s.label}>
                <dt className="text-[0.875rem] text-fg-subtle">{s.label}</dt>
                <dd className="mt-1 text-[3rem] leading-none font-semibold tracking-[-0.04em]">{formatNumber(locale, s.value)}</dd>
              </div>
            ))}
          </dl>
        )}
      </PageHero>

      <Container className="py-16 sm:py-24">
        {ours.length === 0 ? (
          <EmptyState title={t.common.comingSoon} />
        ) : (
          <RevealGroup className="grid gap-4 md:grid-cols-2">
            {ours.map((item) => (
              <RevealItem key={item.id}>
                <ComplianceCard item={item} locale={locale} t={t} />
              </RevealItem>
            ))}
          </RevealGroup>
        )}
        <Reveal className="mt-12">
          <ArrowLink href={href(locale, "/compliance")}>{t.compliance.viewAll}</ArrowLink>
        </Reveal>
      </Container>
    </>
  );
}
