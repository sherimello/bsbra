"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LOCALE_COOKIE, localeLabels, otherLocale, switchLocalePath, type Locale } from "@/lib/i18n/config";
import { cn } from "@/lib/utils";

/** EN ⇄ বাংলা toggle that keeps the visitor on the same page and remembers the choice. */
export function LanguageSwitch({ locale, label, className }: { locale: Locale; label: string; className?: string }) {
  const pathname = usePathname();
  const router = useRouter();
  const target = otherLocale(locale);
  const targetPath = switchLocalePath(pathname, target);

  return (
    <Link
      href={targetPath}
      hrefLang={target}
      lang={target}
      aria-label={`${label}: ${localeLabels[target].name}`}
      onClick={(e) => {
        e.preventDefault();
        document.cookie = `${LOCALE_COOKIE}=${target}; path=/; max-age=31536000; samesite=lax`;
        router.push(targetPath + window.location.search + window.location.hash);
      }}
      className={cn(
        "press grid h-9 min-w-9 place-items-center rounded-full px-2 text-[0.8125rem] font-medium text-fg-muted transition-colors hover:text-fg",
        className,
      )}
    >
      {localeLabels[target].short}
    </Link>
  );
}
