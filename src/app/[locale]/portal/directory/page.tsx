import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getDictionary, href, resolveLocale } from "@/lib/i18n";
import { tr } from "@/lib/i18n/tr";
import { formatDate } from "@/lib/i18n/format";
import { pageMetadata } from "@/lib/seo";
import { requireViewer } from "@/lib/auth/session";
import { canView } from "@/lib/auth/permissions";
import { getMemberDirectory } from "@/lib/data/viewer";
import { Badge } from "@/components/ui/badge";
import { TableShell, Td, Th, Tr } from "@/components/ui/table";

// Depends on the signed-in user and URL; navigations block on the server.
export const instant = false;

export async function generateMetadata({ params }: PageProps<"/[locale]/portal/directory">): Promise<Metadata> {
  const locale = await resolveLocale(params);
  const t = getDictionary(locale);
  return pageMetadata({ locale, path: "/portal/directory", title: t.portal.directoryTitle, noIndex: true });
}

export default async function PortalDirectory({ params }: PageProps<"/[locale]/portal/directory">) {
  const locale = await resolveLocale(params);
  const viewer = await requireViewer(locale, `/${locale}/portal/directory`);
  if (!canView("members", viewer.role)) redirect(href(locale, "/portal"));
  const t = getDictionary(locale);
  const { members, yards } = await getMemberDirectory();
  const yardById = new Map(yards.map((y) => [y.id, y]));

  return (
    <section>
      <h2 className="text-title">{t.portal.directoryTitle}</h2>
      <p className="mt-2 mb-6 text-fg-subtle">{t.portal.directoryLede}</p>
      <TableShell>
        <thead>
          <tr>
            <Th>{t.portal.membershipNo}</Th>
            <Th>{t.auth.organization}</Th>
            <Th>{t.vessels.colYard}</Th>
            <Th>{t.portal.representative}</Th>
            <Th>{t.common.email}</Th>
            <Th>{t.common.status}</Th>
          </tr>
        </thead>
        <tbody>
          {members.map((m) => {
            const yard = m.yard_id ? yardById.get(m.yard_id) : undefined;
            return (
              <Tr key={m.id}>
                <Td className="tabular">{m.membership_no ?? "—"}</Td>
                <Td className="font-semibold text-fg">
                  {locale === "bn" && m.company_name_bn ? m.company_name_bn : m.company_name}
                  {m.joined_on && <span className="block text-[0.75rem] font-normal text-fg-subtle">{formatDate(locale, m.joined_on, "monthYear")}</span>}
                </Td>
                <Td>
                  {yard ? (
                    <Link href={href(locale, `/yards/${yard.slug}`)} className="hover:text-link hover:underline">
                      {tr(yard, "name", locale)}
                    </Link>
                  ) : (
                    "—"
                  )}
                </Td>
                <Td>
                  {m.representative_name ?? "—"}
                  {m.representative_designation && <span className="block text-[0.75rem] text-fg-subtle">{m.representative_designation}</span>}
                </Td>
                <Td>{m.email ? <a href={`mailto:${m.email}`} className="text-link hover:underline">{m.email}</a> : "—"}</Td>
                <Td>
                  <Badge tone={m.status === "active" ? "ok" : m.status === "applicant" ? "info" : "neutral"} dot>
                    {t.labels.memberStatus[m.status]}
                  </Badge>
                </Td>
              </Tr>
            );
          })}
        </tbody>
      </TableShell>
    </section>
  );
}
