import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { requireStaff } from "@/lib/auth/session";
import { assignableRoles, canManageUser, isAdmin, ROLES } from "@/lib/auth/permissions";
import { listProfiles } from "@/lib/admin/queries";
import { formatDate, formatNumber } from "@/lib/i18n/format";
import type { Role } from "@/lib/types";
import { AdminPageHeader } from "@/components/admin/page-header";
import { InviteUser, ROLE_LABELS, UserRoleControls } from "@/components/admin/user-controls";
import { FilterForm } from "@/components/site/filter-form";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { initials } from "@/lib/utils";

// Depends on the signed-in user and URL; navigations block on the server.
export const instant = false;

export const metadata: Metadata = { title: "Users & roles" };

const PERMISSIONS: [Role, string][] = [
  ["super_admin", "Full control, including administrators, settings and the audit log."],
  ["admin", "Manages content, data, minutes, users (except administrators), settings and audit."],
  ["editor", "Publishes, edits and deletes content and industry data."],
  ["data_entry", "Creates and updates drafts and data; cannot publish or delete."],
  ["committee", "Reads internal documents and Executive Committee minutes in the portal."],
  ["member", "Members View: member documents, approved minutes and the member directory."],
  ["corporate", "Corporate View: corporate documents and industry datasets."],
  ["guest", "Registered but not yet approved: Public View only."],
];

export default async function UsersPage({ searchParams }: PageProps<"/admin/users">) {
  const viewer = await requireStaff("/admin/users");
  if (!isAdmin(viewer.role)) redirect("/admin");
  const sp = await searchParams;
  const q = typeof sp.q === "string" ? sp.q : "";
  const role = typeof sp.role === "string" && ROLES.includes(sp.role as Role) ? sp.role : "";
  const { rows, count } = await listProfiles({ q, role });
  const assignable = assignableRoles(viewer.role);

  return (
    <>
      <AdminPageHeader
        title="Users & roles"
        description="Approve access requests, assign roles and deactivate accounts. Every change is recorded in the audit log."
        actions={<InviteUser assignable={assignable} />}
      />

      <FilterForm
        action="/admin/users"
        className="mb-4 bg-surface hairline"
        search={{ name: "q", value: q, placeholder: "Search name, email or organisation" }}
        labels={{ apply: "Apply", clear: "Clear filters", search: "Search" }}
        selects={[{ name: "role", label: "Role", value: role, options: [{ value: "", label: "All roles" }, ...ROLES.map((r) => ({ value: r, label: ROLE_LABELS[r] }))] }]}
      />
      <p className="mb-3 text-[0.8125rem] text-fg-subtle tabular">
        {formatNumber("en", count)} {count === 1 ? "account" : "accounts"}
      </p>

      {rows.length === 0 ? (
        <EmptyState title="No accounts match" className="bg-surface hairline" />
      ) : (
        <ul className="divide-y divide-line overflow-hidden rounded-[var(--radius-card)] bg-surface hairline">
          {rows.map((p) => {
            const locked = p.id === viewer.id || !canManageUser(viewer.role, p.role);
            return (
              <li key={p.id} className="flex flex-col gap-4 px-5 py-4 md:flex-row md:items-center">
                <div className="flex min-w-0 flex-1 items-center gap-3">
                  <span className="grid size-10 shrink-0 place-items-center rounded-full bg-bg-muted text-[0.75rem] font-semibold text-fg-muted">
                    {initials(p.full_name ?? p.email) || "•"}
                  </span>
                  <span className="min-w-0">
                    <span className="flex flex-wrap items-center gap-2">
                      <span className="truncate font-semibold text-fg">{p.full_name ?? "—"}</span>
                      {p.role === "guest" && <Badge tone="warn">Awaiting approval</Badge>}
                      {!p.is_active && <Badge tone="danger">Deactivated</Badge>}
                      {p.id === viewer.id && <Badge>You</Badge>}
                    </span>
                    <span className="block truncate text-[0.8125rem] text-fg-subtle">
                      {p.email}
                      {p.organization ? ` · ${p.organization}` : ""}
                    </span>
                    <span className="block text-[0.75rem] text-fg-faint">
                      Joined {formatDate("en", p.created_at, "medium")}
                      {p.last_sign_in_at ? ` · Last sign-in ${formatDate("en", p.last_sign_in_at, "medium")}` : ""}
                    </span>
                  </span>
                </div>
                <UserRoleControls userId={p.id} role={p.role} active={p.is_active} assignable={assignable} locked={locked} />
              </li>
            );
          })}
        </ul>
      )}

      <section className="mt-10 rounded-[var(--radius-card)] bg-surface p-6 hairline">
        <h2 className="mb-4 text-[1.0625rem] font-semibold">What each role can do</h2>
        <dl className="grid gap-x-8 gap-y-3 md:grid-cols-2">
          {PERMISSIONS.map(([r, text]) => (
            <div key={r} className="flex gap-3 text-[0.875rem]">
              <dt className="w-44 shrink-0 font-medium text-fg">{ROLE_LABELS[r]}</dt>
              <dd className="text-fg-subtle">{text}</dd>
            </div>
          ))}
        </dl>
      </section>
    </>
  );
}
