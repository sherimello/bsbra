import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Plus, Upload } from "lucide-react";
import { getResource } from "@/lib/admin/resources";
import { listRecords, relationOptions } from "@/lib/admin/queries";
import { requireStaff } from "@/lib/auth/session";
import { can } from "@/lib/auth/permissions";
import { AdminPageHeader } from "@/components/admin/page-header";
import { ResourceTable } from "@/components/admin/resource-table";
import { FilterForm } from "@/components/site/filter-form";
import { ButtonLink } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Pagination } from "@/components/ui/pagination";
import { formatNumber } from "@/lib/i18n/format";

// Depends on the signed-in user and URL; navigations block on the server.
export const instant = false;

export async function generateMetadata({ params }: PageProps<"/admin/[resource]">): Promise<Metadata> {
  const { resource } = await params;
  return { title: getResource(resource)?.label ?? "Admin" };
}

export default async function ResourceListPage({ params, searchParams }: PageProps<"/admin/[resource]">) {
  const { resource: key } = await params;
  const resource = getResource(key);
  if (!resource) notFound();
  const viewer = await requireStaff(`/admin/${key}`);
  if (!can(viewer.role, "view", resource.permission)) notFound();

  const sp = await searchParams;
  const one = (k: string) => (Array.isArray(sp[k]) ? sp[k]![0] : (sp[k] as string | undefined))?.trim() || undefined;
  const filters = Object.fromEntries((resource.filters ?? []).map((f) => [f.name, one(f.name) ?? ""]));
  const page = Number(one("page")) || 1;
  const result = await listRecords(resource, {
    q: one("q"),
    filters,
    sort: one("sort"),
    dir: one("dir") === "desc" ? "desc" : "asc",
    page,
  });

  const relations = await relationOptions(resource);
  const relationLabels = Object.fromEntries(Object.entries(relations).map(([k, opts]) => [k, new Map(opts.map((o) => [o.value, o.label]))]));
  const params_ = { q: one("q"), sort: one("sort"), dir: one("dir"), ...filters };
  const canCreate = resource.canCreate !== false && can(viewer.role, "create", resource.permission);

  return (
    <>
      <AdminPageHeader
        title={resource.label}
        description={resource.description}
        actions={
          <>
            {resource.key === "tides" && (
              <ButtonLink href="/admin/tide-import" variant="secondary">
                <Upload />
                Import CSV
              </ButtonLink>
            )}
            {canCreate && (
              <ButtonLink href={`/admin/${resource.key}/new`}>
                <Plus />
                New {resource.singular.toLowerCase()}
              </ButtonLink>
            )}
          </>
        }
      />

      <FilterForm
        action={`/admin/${resource.key}`}
        className="mb-4 bg-surface hairline"
        search={resource.search.length ? { name: "q", value: one("q") ?? "", placeholder: `Search ${resource.label.toLowerCase()}` } : undefined}
        labels={{ apply: "Apply", clear: "Clear filters", search: "Search" }}
        selects={(resource.filters ?? []).map((f) => ({
          name: f.name,
          label: f.label,
          value: filters[f.name] ?? "",
          options: [{ value: "", label: `All ${f.label.toLowerCase()}` }, ...f.options],
        }))}
      />

      <p className="mb-3 text-[0.8125rem] text-fg-subtle tabular">
        {formatNumber("en", result.count)} {result.count === 1 ? "record" : "records"}
      </p>

      {result.rows.length === 0 ? (
        <EmptyState
          title="Nothing here yet"
          body={canCreate ? `Create the first ${resource.singular.toLowerCase()} to get started.` : "No records match your filters."}
          action={canCreate ? <ButtonLink href={`/admin/${resource.key}/new`}>New {resource.singular.toLowerCase()}</ButtonLink> : undefined}
          className="bg-surface hairline"
        />
      ) : (
        <ResourceTable
          resource={resource}
          rows={result.rows}
          relationLabels={relationLabels}
          sort={{ col: result.sortCol, ascending: result.ascending }}
          params={params_}
        />
      )}

      <Pagination
        path={`/admin/${resource.key}`}
        params={params_}
        page={result.page}
        totalPages={Math.ceil(result.count / result.pageSize)}
        labels={{ previous: "Previous", next: "Next", page: "Page", of: "of" }}
      />
    </>
  );
}
