export const locales = ["en", "bn"] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = "en";
export const LOCALE_COOKIE = "NEXT_LOCALE";

export const localeLabels: Record<Locale, { short: string; name: string; intl: string; dir: "ltr" }> = {
  en: { short: "EN", name: "English", intl: "en-GB", dir: "ltr" },
  bn: { short: "বাং", name: "বাংলা", intl: "bn-BD", dir: "ltr" },
};

export function isLocale(value: string | undefined | null): value is Locale {
  return value === "en" || value === "bn";
}

export function otherLocale(locale: Locale): Locale {
  return locale === "en" ? "bn" : "en";
}

/** Prefixes an internal path with the locale: href("bn", "/news") → "/bn/news". */
export function href(locale: Locale, path = "/"): string {
  if (/^https?:\/\//.test(path)) return path;
  const clean = path.startsWith("/") ? path : `/${path}`;
  return clean === "/" ? `/${locale}` : `/${locale}${clean}`;
}

/** Replaces the locale segment of a pathname. */
export function switchLocalePath(pathname: string, to: Locale): string {
  const segments = pathname.split("/");
  if (isLocale(segments[1])) {
    segments[1] = to;
    return segments.join("/") || `/${to}`;
  }
  return `/${to}${pathname === "/" ? "" : pathname}`;
}
