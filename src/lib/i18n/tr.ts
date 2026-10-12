import type { Locale } from "./config";

type BilingualField<T> = {
  [K in keyof T]: K extends `${infer Base}_en` ? (`${Base}_bn` extends keyof T ? Base : never) : never;
}[keyof T];

/**
 * Reads a bilingual column pair, falling back to English when the Bangla
 * value is empty: tr(post, "title", "bn") → post.title_bn || post.title_en.
 * Safe to import from client components (no dictionaries attached).
 */
export function tr<T extends object, F extends BilingualField<T> & string>(row: T, field: F, locale: Locale): string {
  const record = row as Record<string, unknown>;
  const bnValue = record[`${field}_bn`];
  const enValue = record[`${field}_en`];
  if (locale === "bn" && typeof bnValue === "string" && bnValue.trim()) return bnValue;
  return typeof enValue === "string" ? enValue : "";
}

/** Same as tr() for array columns such as facilities_en / facilities_bn. */
export function trList<T extends object, F extends BilingualField<T> & string>(row: T, field: F, locale: Locale): string[] {
  const record = row as Record<string, unknown>;
  const bnValue = record[`${field}_bn`];
  const enValue = record[`${field}_en`];
  if (locale === "bn" && Array.isArray(bnValue) && bnValue.length) return bnValue as string[];
  return Array.isArray(enValue) ? (enValue as string[]) : [];
}
