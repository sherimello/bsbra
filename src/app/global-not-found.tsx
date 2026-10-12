import "./globals.css";
import type { Metadata } from "next";
import Link from "next/link";
import { ThemeScript } from "@/components/theme/theme-script";
import { fontVariables } from "./fonts";

export const metadata: Metadata = {
  title: "Page not found · BSBRA",
  robots: { index: false },
};

export default function GlobalNotFound() {
  return (
    <html lang="en" className={fontVariables} suppressHydrationWarning>
      <head>
        <ThemeScript />
      </head>
      <body className="grid min-h-dvh place-items-center bg-bg px-6 text-center">
        <main>
          <p className="text-eyebrow text-fg-subtle">404</p>
          <h1 className="text-headline mt-3">This page has sailed.</h1>
          <p className="text-lede mx-auto mt-4 max-w-md text-fg-subtle">
            The page you’re looking for doesn’t exist or has moved.
          </p>
          <Link
            href="/"
            className="press mt-8 inline-flex h-11 items-center rounded-full bg-brand px-6 font-medium text-brand-fg"
          >
            Return home
          </Link>
        </main>
      </body>
    </html>
  );
}
