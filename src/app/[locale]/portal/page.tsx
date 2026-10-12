import type { Metadata } from "next";
import Link from "next/link";
import { ArrowUpRight, Clock, Database, FileText, NotebookText, Users } from "lucide-react";
import { getDictionary, href, resolveLocale } from "@/lib/i18n";
import { pageMetadata } from "@/lib/seo";
import { requireViewer } from "@/lib/auth/session";
import { canView } from "@/lib/auth/permissions";
import { getPortalDocuments } from "@/lib/data/viewer";
import { DocumentRow } from "@/components/site/document-row";
import { EmptyState } from "@/components/ui/empty-state";

// Depends on the signed-in user and URL; navigations block on the server.
export const instant = false;

export async function generateMetadata({ params }: PageProps<"/[locale]/portal">): Promise<Metadata> {
  const locale = await resolveLocale(params);
  const t = getDictionary(locale);
  return pageMetadata({ locale, path: "/portal", title: t.nav.portal, noIndex: true });
}

export default async function PortalOverview({ params }: PageProps<"/[locale]/portal">) {
  const locale = await resolveLocale(params);
  const viewer = await requireViewer(locale, `/${locale}/portal`);
  const t = getDictionary(locale);
  const p = t.portal;

  if (viewer.role === "guest") {
    return <EmptyState icon={<Clock />} title={p.pendingTitle} body={p.pendingBody} />;
  }

  const docs = canView("corporate", viewer.role) ? await getPortalDocuments(5) : [];
  const tiles = [
    canView("corporate", viewer.role) && { icon: FileText, title: p.nav.documents, body: p.documentsLede, href: "/portal/documents" },
    canView("members", viewer.role) && { icon: NotebookText, title: p.nav.minutes, body: p.minutesLede, href: "/portal/minutes" },
    canView("members", viewer.role) && { icon: Users, title: p.nav.directory, body: p.directoryLede, href: "/portal/directory" },
    canView("corporate", viewer.role) && { icon: Database, title: p.nav.data, body: p.dataLede, href: "/portal/data" },
  ].filter(Boolean) as { icon: typeof FileText; title: string; body: string; href: string }[];

  return (
    <div className="space-y-12">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {tiles.map(({ icon: Icon, title, body, href: path }) => (
          <Link
            key={path}
            href={href(locale, path)}
            className="group press flex flex-col justify-between gap-6 rounded-[var(--radius-card)] bg-surface p-6 hairline transition-shadow hover:shadow-[var(--shadow-md)]"
          >
            <div className="flex items-start justify-between">
              <span className="grid size-10 place-items-center rounded-xl bg-brand-soft text-brand">
                <Icon className="size-5" />
              </span>
              <ArrowUpRight className="size-4 text-fg-faint group-hover:text-fg" />
            </div>
            <div>
              <h2 className="text-[1.0625rem] font-semibold">{title}</h2>
              <p className="mt-1 text-[0.8125rem] text-fg-subtle">{body}</p>
            </div>
          </Link>
        ))}
      </div>
      {docs.length > 0 && (
        <section>
          <h2 className="text-[1.25rem] font-semibold tracking-[-0.02em]">{p.recentDocs}</h2>
          <ul className="mt-2">
            {docs.map((doc) => (
              <DocumentRow key={doc.id} doc={doc} locale={locale} t={t} />
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
