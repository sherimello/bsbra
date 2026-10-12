import type { Metadata } from "next";
import { Clock, Mail, MapPin, Phone } from "lucide-react";
import { getDictionary, resolveLocale } from "@/lib/i18n";
import { tr } from "@/lib/i18n/tr";
import { pageMetadata } from "@/lib/seo";
import { getSiteSettings } from "@/lib/data/public";
import { PageHero } from "@/components/site/page-hero";
import { Container } from "@/components/ui/container";
import { ContactForm } from "@/components/site/contact-form";
import { Reveal } from "@/components/motion/reveal";

export async function generateMetadata({ params }: PageProps<"/[locale]/contact">): Promise<Metadata> {
  const locale = await resolveLocale(params);
  const t = getDictionary(locale);
  return pageMetadata({ locale, path: "/contact", title: t.nav.contact, description: t.contact.lede });
}

export default async function ContactPage({ params }: PageProps<"/[locale]/contact">) {
  const locale = await resolveLocale(params);
  const t = getDictionary(locale);
  const c = t.contact;
  const settings = await getSiteSettings();
  const socials = [
    ["Facebook", settings.facebook_url],
    ["LinkedIn", settings.linkedin_url],
    ["YouTube", settings.youtube_url],
    ["X", settings.x_url],
  ].filter((s): s is [string, string] => !!s[1]);

  return (
    <>
      <PageHero eyebrow={c.eyebrow} title={c.title} lede={c.lede} />
      <Container className="grid gap-12 pb-24 lg:grid-cols-[5fr_7fr] lg:gap-16">
        <Reveal as="div" className="space-y-6">
          <div className="rounded-[var(--radius-tile)] bg-bg-subtle p-7 sm:p-8">
            <h2 className="text-[1.25rem] font-semibold tracking-[-0.02em]">{c.office}</h2>
            <p className="mt-1 text-fg-subtle">{tr(settings, "org_name", locale)}</p>
            <ul className="mt-6 space-y-4 text-[0.9375rem]">
              {settings.address_en && (
                <li className="flex gap-3">
                  <MapPin className="mt-0.5 size-5 shrink-0 text-brand" />
                  <span className="text-fg-muted">{tr(settings, "address", locale)}</span>
                </li>
              )}
              {settings.phone && (
                <li className="flex gap-3">
                  <Phone className="mt-0.5 size-5 shrink-0 text-brand" />
                  <a href={`tel:${settings.phone}`} className="text-link hover:underline">
                    {settings.phone}
                  </a>
                </li>
              )}
              {settings.email && (
                <li className="flex gap-3">
                  <Mail className="mt-0.5 size-5 shrink-0 text-brand" />
                  <a href={`mailto:${settings.email}`} className="text-link hover:underline">
                    {settings.email}
                  </a>
                </li>
              )}
              {settings.office_hours_en && (
                <li className="flex gap-3">
                  <Clock className="mt-0.5 size-5 shrink-0 text-brand" />
                  <span className="text-fg-muted">
                    <span className="block text-[0.8125rem] text-fg-subtle">{c.hours}</span>
                    {tr(settings, "office_hours", locale)}
                  </span>
                </li>
              )}
            </ul>
            {socials.length > 0 && (
              <div className="mt-6 border-t border-line pt-5">
                <p className="mb-2 text-[0.8125rem] text-fg-subtle">{c.follow}</p>
                <div className="flex flex-wrap gap-2">
                  {socials.map(([label, url]) => (
                    <a key={label} href={url} target="_blank" rel="noopener noreferrer" className="press rounded-full bg-bg px-3.5 py-1.5 text-[0.8125rem] font-medium hairline hover:text-link">
                      {label}
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>
          {settings.map_latitude !== null && settings.map_longitude !== null && (
            <div className="overflow-hidden rounded-[var(--radius-tile)] hairline">
              <iframe
                title={c.map}
                src={`https://maps.google.com/maps?q=${settings.map_latitude},${settings.map_longitude}&z=13&output=embed`}
                className="aspect-[4/3] w-full border-0"
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
            </div>
          )}
        </Reveal>
        <Reveal delay={0.06}>
          <div className="rounded-[var(--radius-tile)] bg-surface p-7 hairline sm:p-10">
            <h2 className="text-title mb-8">{c.formTitle}</h2>
            <ContactForm
              locale={locale}
              labels={{
                name: c.name,
                email: c.email,
                phone: c.phone,
                organization: c.organization,
                subject: c.subject,
                message: c.message,
                send: c.send,
                sending: c.sending,
                success: c.success,
                error: c.error,
                previewError: c.previewError,
                privacy: c.privacy,
                validation: c.validation,
              }}
            />
          </div>
        </Reveal>
      </Container>
    </>
  );
}
