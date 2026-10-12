import type { Metadata } from "next";
import { Mail, Phone, User } from "lucide-react";
import { getDictionary, resolveLocale } from "@/lib/i18n";
import { pageMetadata } from "@/lib/seo";
import { getLatestPosts, getSiteSettings } from "@/lib/data/public";
import { PageHero } from "@/components/site/page-hero";
import { PostCard } from "@/components/site/post-card";
import { Container } from "@/components/ui/container";
import { EmptyState } from "@/components/ui/empty-state";
import { Reveal, RevealGroup, RevealItem } from "@/components/motion/reveal";

export async function generateMetadata({ params }: PageProps<"/[locale]/press">): Promise<Metadata> {
  const locale = await resolveLocale(params);
  const t = getDictionary(locale);
  return pageMetadata({ locale, path: "/press", title: t.nav.press, description: t.press.lede });
}

export default async function PressPage({ params }: PageProps<"/[locale]/press">) {
  const locale = await resolveLocale(params);
  const t = getDictionary(locale);
  const p = t.press;
  const [releases, coverage, settings] = await Promise.all([
    getLatestPosts(["press_release", "statement", "interview", "tv_report"], 12),
    getLatestPosts(["media_coverage"], 20),
    getSiteSettings(),
  ]);
  const hasContact = settings.media_contact_name || settings.media_contact_email || settings.media_contact_phone || settings.email;

  return (
    <>
      <PageHero eyebrow={p.eyebrow} title={p.title} lede={p.lede} />
      <Container className="grid gap-12 pb-24 lg:grid-cols-[8fr_4fr] lg:gap-16">
        <div>
          <Reveal>
            <h2 className="text-title mb-8">{p.releases}</h2>
          </Reveal>
          {releases.length === 0 ? (
            <EmptyState title={p.empty} />
          ) : (
            <RevealGroup className="grid gap-x-6 gap-y-12 sm:grid-cols-2">
              {releases.map((post) => (
                <RevealItem key={post.id}>
                  <PostCard post={post} locale={locale} t={t} />
                </RevealItem>
              ))}
            </RevealGroup>
          )}
        </div>
        <aside className="space-y-10 lg:sticky lg:top-[calc(var(--header-h)+24px)] lg:self-start">
          <Reveal>
            <div className="rounded-[var(--radius-tile)] bg-bg-subtle p-7">
              <h2 className="text-[1.25rem] font-semibold tracking-[-0.02em]">{p.mediaContact}</h2>
              <p className="mt-2 text-[0.9375rem] text-fg-subtle">{p.mediaContactBody}</p>
              {hasContact && (
                <ul className="mt-5 space-y-2.5 text-[0.9375rem]">
                  {settings.media_contact_name && (
                    <li className="flex items-center gap-2.5">
                      <User className="size-4 text-fg-subtle" />
                      {settings.media_contact_name}
                    </li>
                  )}
                  {(settings.media_contact_email || settings.email) && (
                    <li>
                      <a href={`mailto:${settings.media_contact_email ?? settings.email}`} className="flex items-center gap-2.5 hover:underline">
                        <Mail className="size-4 text-fg-subtle" />
                        {settings.media_contact_email ?? settings.email}
                      </a>
                    </li>
                  )}
                  {(settings.media_contact_phone || settings.phone) && (
                    <li>
                      <a href={`tel:${settings.media_contact_phone ?? settings.phone}`} className="flex items-center gap-2.5 hover:underline">
                        <Phone className="size-4 text-fg-subtle" />
                        {settings.media_contact_phone ?? settings.phone}
                      </a>
                    </li>
                  )}
                </ul>
              )}
            </div>
          </Reveal>
          <Reveal delay={0.05}>
            <h2 className="mb-2 text-[1.25rem] font-semibold tracking-[-0.02em]">{p.coverage}</h2>
            {coverage.length === 0 ? (
              <p className="text-[0.9375rem] text-fg-subtle">{p.empty}</p>
            ) : (
              coverage.map((post) => <PostCard key={post.id} post={post} locale={locale} t={t} variant="compact" />)
            )}
          </Reveal>
        </aside>
      </Container>
    </>
  );
}
