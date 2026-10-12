"use client";

import { useSyncExternalStore } from "react";

const subscribe = () => () => {};

/** The current year, computed in the browser so the static shell never goes stale. */
export function CurrentYear({ locale }: { locale: "en" | "bn" }) {
  const year = useSyncExternalStore(
    subscribe,
    () => new Date().getFullYear(),
    () => null,
  );
  if (!year) return null;
  return <>{new Intl.NumberFormat(locale === "bn" ? "bn-BD" : "en-GB", { useGrouping: false }).format(year)}</>;
}
