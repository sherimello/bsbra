import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Download } from "lucide-react";
import { requireStaff } from "@/lib/auth/session";
import { isAdmin } from "@/lib/auth/permissions";
import { listAudit } from "@/lib/admin/queries";
import { formatDate, formatNumber } from "@/lib/i18n/format";
import { AdminPageHeader } from "@/components/admin/page-header";
import { FilterForm } from "@/components/site/filter-form";
import { ButtonLink } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { Pagination, withParams } from "@/components/ui/pagination";
import { DateRange } from "@/components/admin/date-range";

// Depends on the signed-in user and URL; navigations block on the server.
export const instant = false;

export const metadata: Metadata = { title: "Audit log" };

const TABLES = [
  "posts", "pages", "documents", "meeting_minutes", "committee_members", "past_presidents", "yards", "vessels",
  "industry_statistics", "labour_statistics", "tide_entries", "compliance_items", "links", "albums", "photos",
  "members", "profiles", "site_settings", "activity",
];
const ACTIONS = ["insert", "update", "delete", "sign_in", "sign_out", "export", "import", "download", "invite", "password_reset"];
const TONE: Record<string, "ok" | "info" | "danger" | "warn" | "neutral"> = { insert: "ok", update: "info", delete: "danger", import: "warn" };

function preview(value: unknown): string {
  if (value === null || value === undefined) return "—";
  const s = typeof value === "string" ? value : JSON.stringify(value);
  return s.length > 120 ? `${s.slice(0, 119)}…` : s;
}

export default async function AuditPage({ searchParams }: PageProps<"/admin/audit">) {
  const viewer = await requireStaff("/admin/audit");
  if (!isAdmin(viewer.role)) redirect("/admin");
  const sp = await searchParams;
  const one = (k: string) => (typeof sp[k] === "string" ? (sp[k] as string).trim() : "") || undefined;
  const query = {
    table: TABLES.includes(one("table") ?? "") ? one("table") : undefined,
    action: ACTIONS.includes(one("action") ?? "") ? one("action") : undefined,
    actor: one("actor"),
    from: /^\d{4}-\d{2}-\d{2}$/.test(one("from") ?? "") ? one("from") : undefined,
    to: /^\d{4}-\d{2}-\d{2}$/.test(one("to") ?? "") ? one("to") : undefined,
  };
  const page = Number(one("page")) || 1;
  const { rows, count } = await listAudit({ ...query, page });
  const params = { ...query };

  return (
    <>
      <AdminPageHeader
        title="Audit log"
        description="Who entered, changed or deleted information, and when. Entries are written by the database and cannot be edited."
        actions={
          <ButtonLink href={withParams("/admin/audit/export", params)} variant="secondary" prefetch={false}>
            <Download />
            Download report (CSV)
          </ButtonLink>
        }
      />
      <FilterForm
        action="/admin/audit"
        className="mb-3 bg-surface hairline"
        search={{ name: "actor", value: query.actor ?? "", placeholder: "Search user email or record" }}
        labels={{ apply: "Apply", clear: "Clear filters", search: "Search" }}
        selects={[
          { name: "table", label: "Section", value: query.table ?? "", options: [{ value: "", label: "All sections" }, ...TABLES.map((t) => ({ value: t, label: t.replace(/_/g, " ") }))] },
          { name: "action", label: "Action", value: query.action ?? "", options: [{ value: "", label: "All actions" }, ...ACTIONS.map((a) => ({ value: a, label: a.replace(/_/g, " ") }))] },
        ]}
      />
      <DateRange action="/admin/audit" params={params} from={query.from} to={query.to} />

      <p className="mt-4 mb-3 text-[0.8125rem] text-fg-subtle tabular">{formatNumber("en", count)} entries</p>
      {rows.length === 0 ? (
        <EmptyState title="No entries" className="bg-surface hairline" />
      ) : (
        <ul className="divide-y divide-line overflow-hidden rounded-[var(--radius-card)] bg-surface hairline">
          {rows.map((e) => (
            <li key={e.id}>
              <details className="group">
                <summary className="flex cursor-pointer list-none flex-col gap-2 px-5 py-3.5 hover:bg-bg-subtle/60 md:flex-row md:items-center md:gap-4">
                  <span className="w-40 shrink-0 text-[0.8125rem] text-fg-subtle tabular">
                    {formatDate("en", e.occurred_at, "medium")} · {formatDate("en", e.occurred_at, "time")}
                  </span>
                  <span className="flex min-w-0 flex-1 flex-wrap items-center gap-2">
                    <Badge tone={TONE[e.action] ?? "neutral"}>{e.action.replace(/_/g, " ")}</Badge>
                    <span className="text-[0.8125rem] font-medium text-fg">{e.table_name.replace(/_/g, " ")}</span>
                    <span className="truncate text-[0.875rem] text-fg-muted">{e.record_label ?? ""}</span>
                  </span>
                  <span className="shrink-0 text-[0.8125rem] text-fg-subtle">
                    {e.actor_email ?? "system"}
                    {e.actor_role && <span className="text-fg-faint"> · {e.actor_role.replace("_", " ")}</span>}
                  </span>
                </summary>
                <div className="bg-bg-subtle px-5 py-4 text-[0.8125rem]">
                  {e.changed_fields?.length ? (
                    <table className="w-full">
                      <thead>
                        <tr className="text-left text-fg-subtle">
                          <th className="w-48 py-1 font-medium">Field</th>
                          <th className="py-1 font-medium">Before</th>
                          <th className="py-1 font-medium">After</th>
                        </tr>
                      </thead>
                      <tbody className="align-top">
                        {e.changed_fields.map((f) => (
                          <tr key={f} className="border-t border-line">
                            <td className="py-1.5 font-mono text-fg">{f}</td>
                            <td className="py-1.5 pr-4 text-danger">{preview(e.old_data?.[f])}</td>
                            <td className="py-1.5 text-ok">{preview(e.new_data?.[f])}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  ) : (
                    <p className="text-fg-subtle">
                      {e.action === "insert" ? "Record created." : e.action === "delete" ? "Record deleted (snapshot kept in the export)." : preview(e.new_data)}
                    </p>
                  )}
                  {e.record_id && <p className="mt-2 font-mono text-[0.75rem] text-fg-faint">Record ID: {e.record_id}</p>}
                </div>
              </details>
            </li>
          ))}
        </ul>
      )}
      <Pagination path="/admin/audit" params={params} page={page} totalPages={Math.ceil(count / 50)} labels={{ previous: "Previous", next: "Next", page: "Page", of: "of" }} />
    </>
  );
}
