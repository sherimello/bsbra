import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { BarChart3, Database, Download, Waves } from "lucide-react";
import { getDictionary, href, resolveLocale } from "@/lib/i18n";
import { pageMetadata } from "@/lib/seo";
import { requireViewer } from "@/lib/auth/session";
import { canView } from "@/lib/auth/permissions";

// Depends on the signed-in user and URL; navigations block on the server.
export const instant = false;

export async function generateMetadata({ params }: PageProps<"/[locale]/portal/data">): Promise<Metadata> {
  const locale = await resolveLocale(params);
  const t = getDictionary(locale);
  return pageMetadata({ locale, path: "/portal/data", title: t.portal.dataTitle, noIndex: true });
}

export default async function PortalData({ params }: PageProps<"/[locale]/portal/data">) {
  const locale = await resolveLocale(params);
  const viewer = await requireViewer(locale, `/${locale}/portal/data`);
  if (!canView("corporate", viewer.role)) redirect(href(locale, "/portal"));
  const t = getDictionary(locale);
  const datasets = [
    { icon: BarChart3, title: t.industry.tableTitle, body: t.nav.statisticsDesc, href: `/api/reports/statistics?locale=${locale}` },
    { icon: Database, title: t.nav.vessels, body: t.nav.vesselsDesc, href: `/api/reports/vessels?locale=${locale}` },
    { icon: Waves, title: t.nav.tides, body: t.nav.tidesDesc, href: `/api/reports/tides?year=all` },
  ];

  return (
    <section>
      <h2 className="text-title">{t.portal.dataTitle}</h2>
      <p className="mt-2 text-fg-subtle">{t.portal.dataLede}</p>
      <ul className="mt-8 grid gap-4 md:grid-cols-3">
        {datasets.map(({ icon: Icon, title, body, href: url }) => (
          <li key={url} className="flex flex-col justify-between gap-6 rounded-[var(--radius-card)] bg-surface p-6 hairline">
            <div>
              <span className="grid size-10 place-items-center rounded-xl bg-brand-soft text-brand">
                <Icon className="size-5" />
              </span>
              <h3 className="mt-4 text-[1.0625rem] font-semibold">{title}</h3>
              <p className="mt-1 text-[0.875rem] text-fg-subtle">{body}</p>
            </div>
            <a href={url} className="press inline-flex h-10 items-center justify-center gap-2 rounded-full bg-bg-muted text-[0.875rem] font-medium hover:bg-fg hover:text-bg">
              <Download className="size-4" />
              {t.common.exportCsv}
            </a>
          </li>
        ))}
      </ul>
    </section>
  );
}
