import Link from "next/link";
import { ExternalLink } from "lucide-react";
import type { Dictionary } from "@/lib/i18n";
import { href, type Locale } from "@/lib/i18n/config";
import { tr } from "@/lib/i18n/tr";
import type { NavGroup } from "@/lib/navigation";
import type { SiteSettings } from "@/lib/types";
import { isPreviewMode } from "@/lib/env";
import { Container } from "@/components/ui/container";
import { LogoMark } from "./logo";
import { CurrentYear } from "./current-year";

export function SiteFooter({
  locale,
  t,
  groups,
  settings,
}: {
  locale: Locale;
  t: Dictionary;
  groups: NavGroup[];
  settings: SiteSettings;
}) {
  const socials = [
    { label: "Facebook", url: settings.facebook_url },
    { label: "LinkedIn", url: settings.linkedin_url },
    { label: "YouTube", url: settings.youtube_url },
    { label: "X", url: settings.x_url },
  ].filter((s): s is { label: string; url: string } => !!s.url);

  return (
    <footer className="bg-bg-subtle text-[0.75rem] leading-relaxed text-fg-subtle">
      <Container className="pt-14 pb-8">
        <div className="grid gap-10 border-b border-line pb-10 md:grid-cols-[1.2fr_repeat(5,1fr)]">
          <div className="max-w-xs">
            <div className="flex items-center gap-2 text-fg">
              <LogoMark className="size-6 text-fg" />
              <span className="text-[0.9375rem] font-semibold tracking-[-0.02em]">BSBRA</span>
            </div>
            <p className="mt-3">{t.footer.about}</p>
            {settings.bsrb_url && (
              <a
                href={settings.bsrb_url}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-4 inline-flex items-center gap-1 font-medium text-fg-muted hover:text-fg"
              >
                {t.home.bsrbTitle}
                <ExternalLink className="size-3" />
              </a>
            )}
          </div>
          {groups.map((group) => (
            <nav key={group.id} aria-label={group.label}>
              <p className="mb-2.5 font-semibold text-fg">{group.label}</p>
              <ul className="space-y-2">
                {group.items.map((item) => (
                  <li key={item.href}>
                    <Link href={item.href} className="transition-colors hover:text-fg hover:underline">
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>

        <div className="flex flex-col gap-4 pt-6 md:flex-row md:items-center md:justify-between">
          <div className="space-y-1">
            {(settings.address_en || settings.phone || settings.email) && (
              <p>
                {[tr(settings, "address", locale), settings.phone, settings.email].filter(Boolean).join(" · ")}
              </p>
            )}
            <p>
              © <CurrentYear locale={locale} /> {tr(settings, "org_name", locale)}. {t.footer.rights}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
            <Link href={href(locale, "/privacy")} className="hover:text-fg hover:underline">
              {t.footer.privacy}
            </Link>
            <Link href={href(locale, "/terms")} className="hover:text-fg hover:underline">
              {t.footer.terms}
            </Link>
            {socials.map((s) => (
              <a key={s.label} href={s.url} target="_blank" rel="noopener noreferrer" className="hover:text-fg hover:underline">
                {s.label}
              </a>
            ))}
            {isPreviewMode && (
              <span className="rounded-full bg-warn-soft px-2 py-0.5 font-medium text-warn">{t.common.previewNotice}</span>
            )}
          </div>
        </div>
      </Container>
    </footer>
  );
}
