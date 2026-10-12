import type { Metadata } from "next";
import { getDictionary, href, resolveLocale } from "@/lib/i18n";
import { pageMetadata } from "@/lib/seo";
import { AuthShell } from "@/components/auth/auth-shell";
import { ResetPasswordForm } from "@/components/auth/auth-forms";

export async function generateMetadata({ params }: PageProps<"/[locale]/reset-password">): Promise<Metadata> {
  const locale = await resolveLocale(params);
  const t = getDictionary(locale);
  return pageMetadata({ locale, path: "/reset-password", title: t.auth.newPasswordTitle, noIndex: true });
}

/** Reached from the recovery e-mail via /auth/callback, which establishes the session. */
export default async function ResetPasswordPage({ params }: PageProps<"/[locale]/reset-password">) {
  const locale = await resolveLocale(params);
  const t = getDictionary(locale);
  return (
    <AuthShell title={t.auth.newPasswordTitle}>
      <ResetPasswordForm t={t.auth} portalHref={href(locale, "/portal")} />
    </AuthShell>
  );
}
