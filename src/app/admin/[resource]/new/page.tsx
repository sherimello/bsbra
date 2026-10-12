import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { getResource } from "@/lib/admin/resources";
import { relationOptions } from "@/lib/admin/queries";
import { requireStaff } from "@/lib/auth/session";
import { can, isEditor } from "@/lib/auth/permissions";
import { AdminPageHeader } from "@/components/admin/page-header";
import { ResourceEditor } from "@/components/admin/resource-editor";
import { initialValues } from "@/lib/admin/form-values";

// Depends on the signed-in user and URL; navigations block on the server.
export const instant = false;

export async function generateMetadata({ params }: PageProps<"/admin/[resource]/new">): Promise<Metadata> {
  const { resource } = await params;
  const r = getResource(resource);
  return { title: r ? `New ${r.singular.toLowerCase()}` : "Admin" };
}

export default async function NewRecordPage({ params, searchParams }: PageProps<"/admin/[resource]/new">) {
  const { resource: key } = await params;
  const resource = getResource(key);
  if (!resource || resource.canCreate === false) notFound();
  const viewer = await requireStaff(`/admin/${key}/new`);
  if (!can(viewer.role, "create", resource.permission)) redirect(`/admin/${key}`);

  const sp = await searchParams;
  const initial = initialValues(resource.fields);
  // Prefill relation fields from the query string, e.g. /admin/photos/new?album_id=…
  for (const f of resource.fields) {
    const v = sp[f.name];
    if (f.type === "relation" && typeof v === "string") initial[f.name] = v;
  }

  return (
    <>
      <AdminPageHeader
        title={`New ${resource.singular.toLowerCase()}`}
        description={resource.description}
        back={{ href: `/admin/${resource.key}`, label: resource.label }}
      />
      <ResourceEditor
        resourceKey={resource.key}
        id={null}
        fields={resource.fields}
        initial={initial}
        relationOptions={await relationOptions(resource)}
        canPublish={isEditor(viewer.role)}
        canEdit
        folder={resource.table}
      />
    </>
  );
}
