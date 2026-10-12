import type { Metadata } from "next";
import { requireStaff } from "@/lib/auth/session";
import { isEditor } from "@/lib/auth/permissions";
import { AdminPageHeader } from "@/components/admin/page-header";
import { TideImporter } from "@/components/admin/tide-importer";

// Depends on the signed-in user and URL; navigations block on the server.
export const instant = false;

export const metadata: Metadata = { title: "Import tides" };

export default async function TideImportPage() {
  const viewer = await requireStaff("/admin/tide-import");
  return (
    <>
      <AdminPageHeader
        title="Import tide tables"
        description="Load a month or a full year of high and low tides from a CSV file. Existing entries for the same station, date and time are updated."
        back={{ href: "/admin/tides", label: "Tide entries" }}
      />
      <TideImporter canReplace={isEditor(viewer.role)} />
    </>
  );
}
