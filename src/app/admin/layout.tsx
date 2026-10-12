import "../globals.css";
import type { Metadata, Viewport } from "next";
import { Toaster } from "sonner";
import { isPreviewMode } from "@/lib/env";
import { requireStaff } from "@/lib/auth/session";
import { isAdmin } from "@/lib/auth/permissions";
import { resources } from "@/lib/admin/resources";
import { unreadMessages } from "@/lib/admin/queries";
import { MotionProvider } from "@/components/motion/motion-provider";
import { AdminSidebar, type AdminNavGroup } from "@/components/admin/admin-sidebar";
import { ThemeScript } from "@/components/theme/theme-script";
import { fontVariables } from "../fonts";

export const metadata: Metadata = {
  title: { default: "Admin · BSBRA", template: "%s · BSBRA Admin" },
  robots: { index: false, follow: false },
};

export const viewport: Viewport = {
  themeColor: "#f5f5f7",
};

// Every admin page depends on the signed-in user; navigations block on the server.
export const instant = false;

export default async function AdminLayout({ children }: LayoutProps<"/admin">) {
  // Authorise before anything streams, so unauthorised requests get a real HTTP redirect.
  await requireStaff();
  return (
    <html lang="en" className={fontVariables} suppressHydrationWarning>
      <head>
        <ThemeScript />
      </head>
      <body className="min-h-dvh bg-bg-subtle">
        <MotionProvider>
          <AdminShell>{children}</AdminShell>
        </MotionProvider>
        <Toaster position="bottom-right" richColors closeButton />
      </body>
    </html>
  );
}

async function AdminShell({ children }: { children: React.ReactNode }) {
  const viewer = await requireStaff();
  const unread = await unreadMessages();

  const byGroup = (group: string) =>
    resources
      .filter((r) => r.group === group && r.key !== "photos" && (r.permission !== "minutes" || isAdmin(viewer.role)))
      .map((r) => ({ label: r.label, href: `/admin/${r.key}`, badge: r.key === "messages" && unread ? unread : undefined }));

  const groups: AdminNavGroup[] = [
    { label: "Overview", items: [{ label: "Dashboard", href: "/admin" }] },
    { label: "Content", items: byGroup("Content") },
    { label: "Industry data", items: [...byGroup("Industry data"), { label: "Import tides", href: "/admin/tide-import" }] },
    { label: "Governance", items: byGroup("Governance") },
    ...(isAdmin(viewer.role)
      ? [
          {
            label: "System",
            items: [
              { label: "Users & roles", href: "/admin/users" },
              { label: "Audit log", href: "/admin/audit" },
              { label: "Site settings", href: "/admin/settings" },
            ],
          },
        ]
      : []),
  ];

  return (
    <div className="lg:flex">
      <AdminSidebar
        groups={groups}
        viewer={{ name: viewer.fullName ?? viewer.email, email: viewer.email, role: viewer.role }}
        preview={isPreviewMode}
      />
      <main id="main" className="min-w-0 flex-1">
        {isPreviewMode && (
          <div className="border-b border-warn/20 bg-warn-soft px-6 py-2.5 text-[0.8125rem] text-warn">
            Preview mode — you are viewing sample data. Saving is disabled until Supabase is connected.
          </div>
        )}
        <div className="mx-auto w-full max-w-[1280px] px-4 py-8 sm:px-8 lg:py-10">{children}</div>
      </main>
    </div>
  );
}
