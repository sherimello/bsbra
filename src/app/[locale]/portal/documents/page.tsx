import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { FileText } from "lucide-react";
import { getDictionary, href, resolveLocale } from "@/lib/i18n";
import { pageMetadata } from "@/lib/seo";
import { requireViewer } from "@/lib/auth/session";
import { canView } from "@/lib/auth/permissions";
import { getPortalDocuments } from "@/lib/data/viewer";
import { DocumentRow } from "@/components/site/document-row";
import { EmptyState } from "@/components/ui/empty-state";

// Depends on the signed-in user and URL; navigations block on the server.
export const instant = false;

export async function generateMetadata({ params }: PageProps<"/[locale]/portal/documents">): Promise<Metadata> {
  const locale = await resolveLocale(params);
  const t = getDictionary(locale);
  return pageMetadata({ locale, path: "/portal/documents", title: t.portal.documentsTitle, noIndex: true });
}

export default async function PortalDocuments({ params }: PageProps<"/[locale]/portal/documents">) {
  const locale = await resolveLocale(params);
  const viewer = await requireViewer(locale, `/${locale}/portal/documents`);
  if (!canView("corporate", viewer.role)) redirect(href(locale, "/portal"));
  const t = getDictionary(locale);
  const docs = await getPortalDocuments();

  return (
    <section>
      <h2 className="text-title">{t.portal.documentsTitle}</h2>
      <p className="mt-2 text-fg-subtle">{t.portal.documentsLede}</p>
      {docs.length === 0 ? (
        <EmptyState className="mt-8" icon={<FileText />} title={t.publications.empty} />
      ) : (
        <ul className="mt-6">
          {docs.map((doc) => (
            <DocumentRow key={doc.id} doc={doc} locale={locale} t={t} />
          ))}
        </ul>
      )}
    </section>
  );
}
