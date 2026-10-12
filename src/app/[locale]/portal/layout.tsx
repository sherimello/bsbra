import { getDictionary, href, resolveLocale } from "@/lib/i18n";
import { requireViewer } from "@/lib/auth/session";
import { canView, isStaff } from "@/lib/auth/permissions";
import { signOut } from "@/lib/auth/actions";
import { Container } from "@/components/ui/container";
import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { PortalNav } from "@/components/portal/portal-nav";

// The portal depends on the signed-in user, so navigations into it block on the server.
export const instant = false;

export default async function PortalLayout({ children, params }: LayoutProps<"/[locale]/portal">) {
  const locale = await resolveLocale(params);
  return <PortalShell locale={locale}>{children}</PortalShell>;
}

async function PortalShell({ locale, children }: { locale: "en" | "bn"; children: React.ReactNode }) {
  const viewer = await requireViewer(locale, `/${locale}/portal`);
  const t = getDictionary(locale);
  const p = t.portal;
  const l = (path: string) => href(locale, `/portal${path}`);
  const items = [
    { label: p.nav.overview, href: l("") },
    ...(canView("corporate", viewer.role) ? [{ label: p.nav.documents, href: l("/documents") }] : []),
    ...(canView("members", viewer.role) ? [{ label: p.nav.minutes, href: l("/minutes") }] : []),
    ...(canView("members", viewer.role) ? [{ label: p.nav.directory, href: l("/directory") }] : []),
    ...(canView("corporate", viewer.role) ? [{ label: p.nav.data, href: l("/data") }] : []),
    { label: p.nav.profile, href: l("/profile") },
  ];

  return (
    <div className="bg-bg-subtle">
      <Container className="py-10 sm:py-14">
        <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-eyebrow text-fg-subtle">{p.eyebrow}</p>
            <h1 className="text-title mt-2">
              {p.welcome}, {viewer.fullName ?? viewer.email}
            </h1>
            <div className="mt-3 flex flex-wrap items-center gap-2 text-[0.875rem] text-fg-subtle">
              <span>{p.role}:</span>
              <Badge tone={viewer.role === "guest" ? "warn" : "brand"}>{t.labels.role[viewer.role]}</Badge>
              {viewer.organization && <span>· {viewer.organization}</span>}
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {isStaff(viewer.role) && (
              <ButtonLink href="/admin" variant="primary" size="sm">
                {p.adminCta}
              </ButtonLink>
            )}
            <form action={signOut}>
              <input type="hidden" name="locale" value={locale} />
              <button type="submit" className="press h-8 rounded-full px-3.5 text-[0.875rem] font-medium text-fg-muted hairline hover:text-fg">
                {t.nav.signOut}
              </button>
            </form>
          </div>
        </div>
        <PortalNav items={items} className="mt-8" />
      </Container>
      <div className="bg-bg">
        <Container className="py-10 sm:py-14">{children}</Container>
      </div>
    </div>
  );
}
