"use client";

import Link from "next/link";
import { useActionState } from "react";
import { CheckCircle2 } from "lucide-react";
import { requestAccess, sendPasswordReset, signIn, updatePassword, type AuthState } from "@/lib/auth/actions";
import { Button } from "@/components/ui/button";
import { FieldHint, Input, Label } from "@/components/ui/field";
import type { Dictionary } from "@/lib/i18n/dictionaries/en";

type AuthText = Dictionary["auth"];

function errorText(t: AuthText, code: AuthState["code"]) {
  switch (code) {
    case "invalid":
      return t.invalid;
    case "inactive":
      return t.inactive;
    case "weak":
      return t.weakPassword;
    case "disabled":
      return t.previewLede;
    default:
      return t.genericError;
  }
}

function Alert({ state, t }: { state: AuthState; t: AuthText }) {
  if (state.status !== "error") return null;
  return (
    <p role="alert" className="rounded-xl bg-danger-soft px-4 py-3 text-[0.875rem] text-danger">
      {errorText(t, state.code)}
    </p>
  );
}

function Success({ children }: { children: React.ReactNode }) {
  return (
    <div role="status" className="flex flex-col items-center rounded-2xl bg-ok-soft px-5 py-10 text-center">
      <CheckCircle2 className="size-9 text-ok" strokeWidth={1.6} />
      <p className="mt-3 text-[0.9375rem] text-fg">{children}</p>
    </div>
  );
}

export function SignInForm({ t, locale, next, forgotHref }: { t: AuthText; locale: string; next?: string; forgotHref: string }) {
  const [state, action, pending] = useActionState<AuthState, FormData>(signIn, { status: "idle" });
  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="locale" value={locale} />
      {next && <input type="hidden" name="next" value={next} />}
      <div>
        <Label htmlFor="si-email">{t.email}</Label>
        <Input id="si-email" name="email" type="email" autoComplete="email" required autoFocus />
      </div>
      <div>
        <div className="flex items-baseline justify-between">
          <Label htmlFor="si-password">{t.password}</Label>
          <Link href={forgotHref} className="text-[0.8125rem] text-link hover:underline">
            {t.forgot}
          </Link>
        </div>
        <Input id="si-password" name="password" type="password" autoComplete="current-password" required />
      </div>
      <Alert state={state} t={t} />
      <Button type="submit" size="lg" className="w-full" disabled={pending}>
        {pending ? t.signingIn : t.signIn}
      </Button>
    </form>
  );
}

export function RequestAccessForm({ t, locale }: { t: AuthText; locale: string }) {
  const [state, action, pending] = useActionState<AuthState, FormData>(requestAccess, { status: "idle" });
  if (state.status === "success") return <Success>{t.requestSent}</Success>;
  return (
    <form action={action} className="grid gap-4 sm:grid-cols-2">
      <input type="hidden" name="locale" value={locale} />
      <div className="sm:col-span-2">
        <Label htmlFor="ra-name">{t.fullName}</Label>
        <Input id="ra-name" name="full_name" autoComplete="name" required />
      </div>
      <div>
        <Label htmlFor="ra-org">{t.organization}</Label>
        <Input id="ra-org" name="organization" autoComplete="organization" required />
      </div>
      <div>
        <Label htmlFor="ra-designation">{t.designation}</Label>
        <Input id="ra-designation" name="designation" autoComplete="organization-title" />
      </div>
      <div>
        <Label htmlFor="ra-email">{t.email}</Label>
        <Input id="ra-email" name="email" type="email" autoComplete="email" required />
      </div>
      <div>
        <Label htmlFor="ra-phone">{t.phone}</Label>
        <Input id="ra-phone" name="phone" type="tel" autoComplete="tel" />
      </div>
      <div className="sm:col-span-2">
        <Label htmlFor="ra-password">{t.createPassword}</Label>
        <Input id="ra-password" name="password" type="password" autoComplete="new-password" required minLength={8} />
        <FieldHint>{t.passwordHint}</FieldHint>
      </div>
      <div className="sm:col-span-2">
        <Alert state={state} t={t} />
      </div>
      <Button type="submit" size="lg" className="w-full sm:col-span-2" disabled={pending}>
        {t.submitRequest}
      </Button>
    </form>
  );
}

export function ForgotPasswordForm({ t, locale }: { t: AuthText; locale: string }) {
  const [state, action, pending] = useActionState<AuthState, FormData>(sendPasswordReset, { status: "idle" });
  if (state.status === "success") return <Success>{t.resetSent}</Success>;
  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="locale" value={locale} />
      <div>
        <Label htmlFor="fp-email">{t.email}</Label>
        <Input id="fp-email" name="email" type="email" autoComplete="email" required autoFocus />
      </div>
      <Alert state={state} t={t} />
      <Button type="submit" size="lg" className="w-full" disabled={pending}>
        {t.sendReset}
      </Button>
    </form>
  );
}

export function ResetPasswordForm({ t, portalHref }: { t: AuthText; portalHref: string }) {
  const [state, action, pending] = useActionState<AuthState, FormData>(updatePassword, { status: "idle" });
  if (state.status === "success")
    return (
      <div className="space-y-4">
        <Success>{t.passwordUpdated}</Success>
        <Link href={portalHref} className="block text-center text-[0.9375rem] font-medium text-link hover:underline">
          →
        </Link>
      </div>
    );
  return (
    <form action={action} className="space-y-4">
      <div>
        <Label htmlFor="rp-password">{t.newPassword}</Label>
        <Input id="rp-password" name="password" type="password" autoComplete="new-password" required minLength={8} autoFocus />
        <FieldHint>{t.passwordHint}</FieldHint>
      </div>
      <Alert state={state} t={t} />
      <Button type="submit" size="lg" className="w-full" disabled={pending}>
        {t.updatePassword}
      </Button>
    </form>
  );
}
