import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { getDictionary, href, resolveLocale, type Dictionary, type Locale } from "@/lib/i18n";
import { allowAccessRequests, isPreviewMode } from "@/lib/env";
import { pageMetadata } from "@/lib/seo";
import { previewSignIn } from "@/lib/auth/actions";
import { ROLES } from "@/lib/auth/permissions";
import { AuthShell } from "@/components/auth/auth-shell";
import { SignInForm } from "@/components/auth/auth-forms";

export async function generateMetadata({ params }: PageProps<"/[locale]/login">): Promise<Metadata> {
  const locale = await resolveLocale(params);
  const t = getDictionary(locale);
  return pageMetadata({ locale, path: "/login", title: t.auth.signInTitle, noIndex: true });
}

export default async function LoginPage({ params, searchParams }: PageProps<"/[locale]/login">) {
  const locale = await resolveLocale(params);
  const t = getDictionary(locale);
  return (
    <AuthShell
      title={isPreviewMode ? t.auth.previewTitle : t.auth.signInTitle}
      lede={isPreviewMode ? t.auth.previewLede : t.auth.signInLede}
      footer={
        allowAccessRequests && !isPreviewMode ? (
          <>
            {t.auth.noAccount}{" "}
            <Link href={href(locale, "/request-access")} className="font-medium text-link hover:underline">
              {t.auth.requestAccess}
            </Link>
          </>
        ) : undefined
      }
    >
      <Suspense fallback={<div className="skeleton h-56 rounded-2xl" />}>
        <LoginBody locale={locale} t={t} searchParams={searchParams} />
      </Suspense>
    </AuthShell>
  );
}

async function LoginBody({ locale, t, searchParams }: { locale: Locale; t: Dictionary; searchParams: PageProps<"/[locale]/login">["searchParams"] }) {
  const sp = await searchParams;
  const next = typeof sp.next === "string" && sp.next.startsWith("/") && !sp.next.startsWith("//") ? sp.next : undefined;

  if (isPreviewMode) {
    return (
      <form action={previewSignIn} className="space-y-2">
        <input type="hidden" name="locale" value={locale} />
        {next && <input type="hidden" name="next" value={next} />}
        <p className="mb-3 text-center text-[0.8125rem] font-medium text-fg-subtle">{t.auth.previewAs}</p>
        {ROLES.map((role) => (
          <button
            key={role}
            type="submit"
            name="role"
            value={role}
            className="press flex w-full items-center justify-between rounded-xl bg-bg-subtle px-4 py-3 text-left text-[0.9375rem] transition-colors hover:bg-bg-muted"
          >
            <span className="font-medium text-fg">{t.labels.role[role]}</span>
            <span className="text-[0.75rem] text-fg-faint">{role.replace("_", " ")}</span>
          </button>
        ))}
      </form>
    );
  }

  return (
    <>
      {sp.error === "link" && (
        <p role="alert" className="mb-4 rounded-xl bg-warn-soft px-4 py-3 text-[0.875rem] text-warn">
          {t.auth.genericError}
        </p>
      )}
      <SignInForm t={t.auth} locale={locale} next={next} forgotHref={href(locale, "/forgot-password")} />
    </>
  );
}
