import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ExternalLink, History } from "lucide-react";
import { getResource } from "@/lib/admin/resources";
import { getRecord, listAudit, relationOptions } from "@/lib/admin/queries";
import { viewerReader } from "@/lib/data/readers";
import { requireStaff } from "@/lib/auth/session";
import { can, isAdmin, isEditor } from "@/lib/auth/permissions";
import { formatDate } from "@/lib/i18n/format";
import { AdminPageHeader } from "@/components/admin/page-header";
import { DeleteRecordButton, ResourceEditor } from "@/components/admin/resource-editor";
import { initialValues } from "@/lib/admin/form-values";
import { AlbumPhotos } from "@/components/admin/album-photos";
import { ButtonLink } from "@/components/ui/button";

// Depends on the signed-in user and URL; navigations block on the server.
export const instant = false;

export async function generateMetadata({ params }: PageProps<"/admin/[resource]/[id]">): Promise<Metadata> {
  const { resource } = await params;
  const r = getResource(resource);
  return { title: r ? `Edit ${r.singular.toLowerCase()}` : "Admin" };
}

export default async function EditRecordPage({ params }: PageProps<"/admin/[resource]/[id]">) {
  const { resource: key, id } = await params;
  const resource = getResource(key);
  if (!resource) notFound();
  const viewer = await requireStaff(`/admin/${key}/${id}`);
  if (!can(viewer.role, "view", resource.permission)) notFound();
  const record = await getRecord(resource, id);
  if (!record) notFound();

  const title = String(record[resource.titleField] ?? resource.singular);
  const canEditRecord =
    can(viewer.role, "edit", resource.permission) &&
    (!resource.editorial || isEditor(viewer.role) || ["draft", "review"].includes(String(record.status)));
  const publicPath = resource.publicPath?.(record) ?? null;
  const history = isAdmin(viewer.role)
    ? (await listAudit({ table: resource.table, recordId: id, pageSize: 8 })).rows
    : [];

  const photos =
    resource.key === "albums"
      ? (await (await viewerReader()).list({ table: "photos", filters: [{ col: "album_id", op: "eq", value: id }], order: [{ col: "sort_order" }] })).rows
      : [];

  return (
    <>
      <AdminPageHeader
        title={title}
        description={`Last updated ${formatDate("en", String(record.updated_at ?? record.created_at ?? ""), "long")}`}
        back={{ href: `/admin/${resource.key}`, label: resource.label }}
        actions={
          <>
            {publicPath && (
              <ButtonLink href={publicPath} variant="secondary" external>
                <ExternalLink />
                View on site
              </ButtonLink>
            )}
            {can(viewer.role, "delete", resource.permission) && <DeleteRecordButton resourceKey={resource.key} id={id} label={title} />}
          </>
        }
      />

      {!canEditRecord && (
        <p className="mb-6 rounded-xl bg-info-soft px-4 py-3 text-[0.875rem] text-info">
          This item is published. Only editors and administrators can change published content.
        </p>
      )}

      {resource.key === "albums" && <AlbumPhotos albumId={id} photos={photos} />}

      {history.length > 0 && (
        <section className="mb-6 rounded-[var(--radius-card)] bg-surface p-6 hairline">
          <h2 className="mb-3 flex items-center gap-2 text-[0.9375rem] font-semibold">
            <History className="size-4" /> Recent changes
          </h2>
          <ul className="space-y-1.5 text-[0.8125rem] text-fg-muted">
            {history.map((e) => (
              <li key={e.id}>
                <span className="tabular">{formatDate("en", e.occurred_at, "medium")}</span> · {e.actor_email ?? "system"} · {e.action}
                {e.changed_fields?.length ? ` (${e.changed_fields.join(", ")})` : ""}
              </li>
            ))}
          </ul>
        </section>
      )}

      <ResourceEditor
        resourceKey={resource.key}
        id={id}
        fields={resource.fields}
        initial={initialValues(resource.fields, record)}
        relationOptions={await relationOptions(resource)}
        canPublish={isEditor(viewer.role)}
        canEdit={canEditRecord}
        folder={resource.table}
      />

    </>
  );
}
