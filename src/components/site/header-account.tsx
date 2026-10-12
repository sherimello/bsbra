import Link from "next/link";
import { CircleUser } from "lucide-react";
import { getViewer } from "@/lib/auth/session";
import { isStaff } from "@/lib/auth/permissions";
import type { Locale } from "@/lib/i18n/config";
import { initials } from "@/lib/utils";

/** Streams into the static header: sign-in link, or the viewer's avatar. */
export async function HeaderAccount({ locale, signInLabel, portalLabel }: { locale: Locale; signInLabel: string; portalLabel: string }) {
  const viewer = await getViewer();
  if (!viewer) return <SignInIcon locale={locale} label={signInLabel} />;

  const destination = isStaff(viewer.role) ? "/admin" : `/${locale}/portal`;
  const name = viewer.fullName ?? viewer.email;
  return (
    <Link
      href={destination}
      title={`${portalLabel} — ${name}`}
      aria-label={`${portalLabel}: ${name}`}
      className="press ml-1 grid size-8 place-items-center rounded-full bg-brand text-[0.6875rem] font-semibold text-brand-fg"
    >
      {initials(name) || "•"}
    </Link>
  );
}

export function SignInIcon({ locale, label }: { locale: Locale; label: string }) {
  return (
    <Link
      href={`/${locale}/login`}
      aria-label={label}
      className="press grid size-9 place-items-center rounded-full text-fg-muted transition-colors hover:text-fg"
    >
      <CircleUser className="size-[1.125rem]" strokeWidth={1.8} />
    </Link>
  );
}
