import type { Metadata } from "next";
import { getDictionary, resolveLocale } from "@/lib/i18n";
import { pageMetadata } from "@/lib/seo";
import { requireViewer } from "@/lib/auth/session";
import { ProfileForm } from "@/components/portal/profile-form";

// Depends on the signed-in user and URL; navigations block on the server.
export const instant = false;

export async function generateMetadata({ params }: PageProps<"/[locale]/portal/profile">): Promise<Metadata> {
  const locale = await resolveLocale(params);
  const t = getDictionary(locale);
  return pageMetadata({ locale, path: "/portal/profile", title: t.portal.profileTitle, noIndex: true });
}

export default async function PortalProfile({ params }: PageProps<"/[locale]/portal/profile">) {
  const locale = await resolveLocale(params);
  const viewer = await requireViewer(locale, `/${locale}/portal/profile`);
  const t = getDictionary(locale);
  return (
    <section className="max-w-2xl">
      <h2 className="text-title">{t.portal.profileTitle}</h2>
      <p className="mt-2 text-fg-subtle">{t.portal.profileLede}</p>
      <ProfileForm
        className="mt-8"
        values={{
          email: viewer.email,
          full_name: viewer.fullName ?? "",
          organization: viewer.organization ?? "",
          designation: viewer.designation ?? "",
          phone: viewer.phone ?? "",
        }}
        labels={{
          email: t.auth.email,
          full_name: t.auth.fullName,
          organization: t.auth.organization,
          designation: t.auth.designation,
          phone: t.auth.phone,
          save: t.portal.save,
          saved: t.portal.saved,
          error: t.auth.genericError,
        }}
      />
    </section>
  );
}
