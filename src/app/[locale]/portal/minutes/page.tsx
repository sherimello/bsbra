import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Download, Lock, NotebookText } from "lucide-react";
import { getDictionary, href, resolveLocale } from "@/lib/i18n";
import { tr } from "@/lib/i18n/tr";
import { formatDate } from "@/lib/i18n/format";
import { pageMetadata } from "@/lib/seo";
import { requireViewer } from "@/lib/auth/session";
import { canView } from "@/lib/auth/permissions";
import { getMinutes } from "@/lib/data/viewer";
import { accessLevelTone } from "@/lib/tones";
import { formatBytes } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";

// Depends on the signed-in user and URL; navigations block on the server.
export const instant = false;

export async function generateMetadata({ params }: PageProps<"/[locale]/portal/minutes">): Promise<Metadata> {
  const locale = await resolveLocale(params);
  const t = getDictionary(locale);
  return pageMetadata({ locale, path: "/portal/minutes", title: t.portal.minutesTitle, noIndex: true });
}

export default async function PortalMinutes({ params }: PageProps<"/[locale]/portal/minutes">) {
  const locale = await resolveLocale(params);
  const viewer = await requireViewer(locale, `/${locale}/portal/minutes`);
  if (!canView("members", viewer.role)) redirect(href(locale, "/portal"));
  const t = getDictionary(locale);
  const minutes = await getMinutes();

  return (
    <section>
      <h2 className="text-title">{t.portal.minutesTitle}</h2>
      <p className="mt-2 text-fg-subtle">{t.portal.minutesLede}</p>
      {minutes.length === 0 ? (
        <EmptyState className="mt-8" icon={<NotebookText />} title={t.portal.minutesEmpty} />
      ) : (
        <ul className="mt-6 divide-y divide-line">
          {minutes.map((m) => (
            <li key={m.id} className="flex flex-col gap-4 py-5 sm:flex-row sm:items-center">
              <div className="min-w-0 flex-1">
                <div className="mb-1 flex flex-wrap items-center gap-2 text-[0.75rem] text-fg-subtle">
                  <Badge>{t.labels.meetingType[m.meeting_type]}</Badge>
                  <span>{formatDate(locale, m.meeting_date, "long")}</span>
                  {m.meeting_no && (
                    <span>
                      · {t.portal.meetingNo} {m.meeting_no}
                    </span>
                  )}
                  {m.access_level !== "members" && (
                    <Badge tone={accessLevelTone[m.access_level]}>
                      <Lock className="size-3" />
                      {t.labels.accessLevel[m.access_level]}
                    </Badge>
                  )}
                </div>
                <h3 className="text-[1.0625rem] font-semibold tracking-[-0.015em]">{tr(m, "title", locale)}</h3>
                {m.summary_en && <p className="mt-1 text-[0.875rem] text-fg-subtle">{tr(m, "summary", locale)}</p>}
              </div>
              {m.file_path && (
                <a
                  href={`/api/minutes/${m.id}`}
                  className="press inline-flex h-10 shrink-0 items-center gap-2 self-start rounded-full bg-bg-muted px-4 text-[0.875rem] font-medium hover:bg-fg hover:text-bg sm:self-center"
                >
                  <Download className="size-4" />
                  {t.common.download}
                  {m.file_size ? <span className="font-normal opacity-60">{formatBytes(m.file_size)}</span> : null}
                </a>
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
