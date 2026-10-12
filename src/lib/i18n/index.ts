import "server-only";
import { notFound } from "next/navigation";
import en, { type Dictionary } from "./dictionaries/en";
import bn from "./dictionaries/bn";
import type { Locale } from "./config";

export type { Dictionary };
export * from "./config";
export * from "./tr";

const dictionaries: Record<Locale, Dictionary> = { en, bn };

/** Server-only: pass the slices a client component needs down as props. */
export function getDictionary(locale: Locale): Dictionary {
  return dictionaries[locale];
}

/** Resolves and validates the [locale] route param (404 for anything else). */
export async function resolveLocale(params: Promise<{ locale: string }>): Promise<Locale> {
  const { locale } = await params;
  if (locale !== "en" && locale !== "bn") notFound();
  return locale;
}
