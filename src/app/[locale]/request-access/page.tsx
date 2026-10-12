import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getDictionary, href, resolveLocale } from "@/lib/i18n";
import { allowAccessRequests } from "@/lib/env";
import { pageMetadata } from "@/lib/seo";
import { AuthShell } from "@/components/auth/auth-shell";
import { RequestAccessForm } from "@/components/auth/auth-forms";

export async function generateMetadata({ params }: PageProps<"/[locale]/request-access">): Promise<Metadata> {
  const locale = await resolveLocale(params);
  const t = getDictionary(locale);
  return pageMetadata({ locale, path: "/request-access", title: t.auth.requestTitle, noIndex: true });
}

export default async function RequestAccessPage({ params }: PageProps<"/[locale]/request-access">) {
  const locale = await resolveLocale(params);
  if (!allowAccessRequests) notFound();
  const t = getDictionary(locale);
  return (
    <AuthShell
      wide
      title={t.auth.requestTitle}
      lede={t.auth.requestLede}
      footer={
        <>
          {t.auth.haveAccount}{" "}
          <Link href={href(locale, "/login")} className="font-medium text-link hover:underline">
            {t.auth.signIn}
          </Link>
        </>
      }
    >
      <RequestAccessForm t={t.auth} locale={locale} />
    </AuthShell>
  );
}
