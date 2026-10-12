import type { Metadata } from "next";
import Link from "next/link";
import { ArrowUpRight, FilePlus2, Mail, Ship, Upload } from "lucide-react";
import { requireStaff } from "@/lib/auth/session";
import { isAdmin } from "@/lib/auth/permissions";
import { countRows, listAudit } from "@/lib/admin/queries";
import { formatDate, formatNumber } from "@/lib/i18n/format";
import { AdminPageHeader } from "@/components/admin/page-header";
import { Badge } from "@/components/ui/badge";

// Depends on the signed-in user and URL; navigations block on the server.
export const instant = false;

export const metadata: Metadata = { title: "Dashboard" };

const ACTION_TONE: Record<string, "ok" | "info" | "danger" | "neutral" | "warn"> = {
  insert: "ok",
  update: "info",
  delete: "danger",
  import: "warn",
  export: "neutral",
  sign_in: "neutral",
};

export default async function AdminDashboard() {
  const viewer = await requireStaff();
  const [vessels, yards, posts, drafts, documents, members, messages] = await Promise.all([
    countRows("vessels"),
    countRows("yards"),
    countRows("posts", [{ col: "status", op: "eq", value: "published" }]),
    countRows("posts", [{ col: "status", op: "in", value: ["draft", "review"] }]),
    countRows("documents"),
    countRows("members"),
    countRows("contact_messages", [{ col: "status", op: "eq", value: "new" }]).catch(() => 0),
  ]);
  const activity = isAdmin(viewer.role) ? (await listAudit({ pageSize: 8 })).rows : [];

  const stats = [
    { label: "Vessels in database", value: vessels, href: "/admin/vessels" },
    { label: "Yards", value: yards, href: "/admin/yards" },
    { label: "Published posts", value: posts, href: "/admin/posts?status=published" },
    { label: "Drafts awaiting review", value: drafts, href: "/admin/posts?status=review" },
    { label: "Documents", value: documents, href: "/admin/documents" },
    { label: "Member organisations", value: members, href: "/admin/members" },
  ];

  const actions = [
    { icon: FilePlus2, label: "Write a news post", href: "/admin/posts/new" },
    { icon: Ship, label: "Record a vessel", href: "/admin/vessels/new" },
    { icon: Upload, label: "Upload a document", href: "/admin/documents/new" },
    { icon: Mail, label: `Messages${messages ? ` (${messages} new)` : ""}`, href: "/admin/messages" },
  ];

  return (
    <>
      <AdminPageHeader
        title={`Good to see you${viewer.fullName ? `, ${viewer.fullName.split(" ")[0]}` : ""}.`}
        description="Manage BSBRA’s website, industry data and member resources."
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-3 xl:grid-cols-6">
        {stats.map((s) => (
          <Link key={s.label} href={s.href} className="group press rounded-[var(--radius-card)] bg-surface p-5 hairline transition-shadow hover:shadow-[var(--shadow-md)]">
            <p className="text-[2rem] leading-none font-semibold tracking-[-0.03em]">{formatNumber("en", s.value)}</p>
            <p className="mt-2 flex items-center justify-between text-[0.8125rem] text-fg-subtle">
              {s.label}
              <ArrowUpRight className="size-3.5 opacity-0 transition-opacity group-hover:opacity-100" />
            </p>
          </Link>
        ))}
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_1.4fr]">
        <section className="rounded-[var(--radius-card)] bg-surface p-6 hairline">
          <h2 className="mb-4 text-[1.0625rem] font-semibold">Quick actions</h2>
          <ul className="space-y-2">
            {actions.map(({ icon: Icon, label, href }) => (
              <li key={href}>
                <Link href={href} className="press flex items-center gap-3 rounded-xl bg-bg-subtle px-4 py-3 text-[0.9375rem] font-medium hover:bg-bg-muted">
                  <span className="grid size-9 place-items-center rounded-lg bg-brand-soft text-brand">
                    <Icon className="size-4" />
                  </span>
                  {label}
                </Link>
              </li>
            ))}
          </ul>
        </section>

        <section className="rounded-[var(--radius-card)] bg-surface p-6 hairline">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-[1.0625rem] font-semibold">Recent activity</h2>
            {isAdmin(viewer.role) && (
              <Link href="/admin/audit" className="text-[0.8125rem] font-medium text-link hover:underline">
                Audit log
              </Link>
            )}
          </div>
          {activity.length === 0 ? (
            <p className="text-[0.875rem] text-fg-subtle">
              {isAdmin(viewer.role) ? "No activity recorded yet." : "Activity is visible to administrators."}
            </p>
          ) : (
            <ul className="divide-y divide-line">
              {activity.map((e) => (
                <li key={e.id} className="flex items-start justify-between gap-4 py-2.5 text-[0.8125rem]">
                  <span className="min-w-0">
                    <span className="flex flex-wrap items-center gap-2">
                      <Badge tone={ACTION_TONE[e.action] ?? "neutral"}>{e.action.replace("_", " ")}</Badge>
                      <span className="font-medium text-fg">{e.table_name.replace(/_/g, " ")}</span>
                    </span>
                    <span className="mt-0.5 block truncate text-fg-subtle">
                      {e.record_label ?? "—"} · {e.actor_email ?? "system"}
                    </span>
                  </span>
                  <span className="shrink-0 text-fg-faint tabular">{formatDate("en", e.occurred_at, "dayMonth")}</span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </>
  );
}
