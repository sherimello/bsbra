import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { requireStaff } from "@/lib/auth/session";
import { isAdmin } from "@/lib/auth/permissions";
import { SETTINGS_FIELDS } from "@/lib/admin/resources";
import { viewerReader } from "@/lib/data/readers";
import { siteSettings as fallback } from "@/lib/demo/content";
import { AdminPageHeader } from "@/components/admin/page-header";
import { SettingsEditor } from "@/components/admin/resource-editor";
import { initialValues } from "@/lib/admin/form-values";

// Depends on the signed-in user and URL; navigations block on the server.
export const instant = false;

export const metadata: Metadata = { title: "Site settings" };

export default async function SettingsPage() {
  const viewer = await requireStaff("/admin/settings");
  if (!isAdmin(viewer.role)) redirect("/admin");
  const reader = await viewerReader();
  const settings = (await reader.first("site_settings", [{ col: "id", op: "eq", value: 1 }])) ?? fallback;

  return (
    <>
      <AdminPageHeader title="Site settings" description="Organisation details, contacts, social links, the BSRB link and the homepage announcement." />
      <SettingsEditor fields={SETTINGS_FIELDS} initial={initialValues(SETTINGS_FIELDS, settings as unknown as Record<string, unknown>)} canEdit />
    </>
  );
}
