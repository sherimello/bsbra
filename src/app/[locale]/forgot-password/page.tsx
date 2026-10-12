import type { Metadata } from "next";
import Link from "next/link";
import { getDictionary, href, resolveLocale } from "@/lib/i18n";
import { pageMetadata } from "@/lib/seo";
import { AuthShell } from "@/components/auth/auth-shell";
import { ForgotPasswordForm } from "@/components/auth/auth-forms";

export async function generateMetadata({ params }: PageProps<"/[locale]/forgot-password">): Promise<Metadata> {
  const locale = await resolveLocale(params);
  const t = getDictionary(locale);
  return pageMetadata({ locale, path: "/forgot-password", title: t.auth.resetTitle, noIndex: true });
}

export default async function ForgotPasswordPage({ params }: PageProps<"/[locale]/forgot-password">) {
  const locale = await resolveLocale(params);
  const t = getDictionary(locale);
  return (
    <AuthShell
      title={t.auth.resetTitle}
      lede={t.auth.resetLede}
      footer={
        <Link href={href(locale, "/login")} className="font-medium text-link hover:underline">
          {t.auth.backToSignIn}
        </Link>
      }
    >
      <ForgotPasswordForm t={t.auth} locale={locale} />
    </AuthShell>
  );
}
