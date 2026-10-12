import { NextResponse, type NextRequest } from "next/server";
import { LOCALE_COOKIE, defaultLocale, isLocale, type Locale } from "@/lib/i18n/config";
import { isSupabaseConfigured } from "@/lib/env";
import { updateSession, withSessionCookies } from "@/lib/supabase/proxy";

const UNLOCALIZED = /^\/(admin|api|auth)(\/|$)/;

function preferredLocale(request: NextRequest): Locale {
  const cookie = request.cookies.get(LOCALE_COOKIE)?.value;
  if (isLocale(cookie)) return cookie;
  const accept = request.headers.get("accept-language") ?? "";
  return /(^|,)\s*bn\b/i.test(accept) ? "bn" : defaultLocale;
}

export async function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;

  // 1 · Every public page lives under /en or /bn.
  if (!UNLOCALIZED.test(pathname)) {
    const first = pathname.split("/")[1];
    if (!isLocale(first)) {
      const url = request.nextUrl.clone();
      url.pathname = `/${preferredLocale(request)}${pathname === "/" ? "" : pathname}`;
      url.search = search;
      return NextResponse.redirect(url);
    }
  }

  const isPrivate = pathname.startsWith("/admin") || /^\/(en|bn)\/portal(\/|$)/.test(pathname);

  // Preview builds simulate sign-in with a cookie; gate private areas the same way.
  if (!isSupabaseConfigured) {
    if (isPrivate && !request.cookies.get("bsbra_preview_role")) {
      const locale = isLocale(pathname.split("/")[1]) ? (pathname.split("/")[1] as Locale) : preferredLocale(request);
      const url = request.nextUrl.clone();
      url.pathname = `/${locale}/login`;
      url.search = `?next=${encodeURIComponent(pathname + search)}`;
      return NextResponse.redirect(url);
    }
    return NextResponse.next();
  }

  // 2 · Keep the Supabase session fresh.
  const { response, isSignedIn } = await updateSession(request);

  // 3 · Optimistic gate for private areas (roles are enforced server-side).
  if (isPrivate && !isSignedIn) {
    const locale = isLocale(pathname.split("/")[1]) ? (pathname.split("/")[1] as Locale) : preferredLocale(request);
    const url = request.nextUrl.clone();
    url.pathname = `/${locale}/login`;
    url.search = `?next=${encodeURIComponent(pathname + search)}`;
    return withSessionCookies(response, NextResponse.redirect(url));
  }

  return response;
}

export const config = {
  matcher: [
    // Everything except Next internals, metadata files and static assets.
    "/((?!_next/static|_next/image|favicon.ico|icon.svg|apple-icon|opengraph-image|robots.txt|sitemap.xml|manifest.webmanifest|.*\\.(?:svg|png|jpg|jpeg|gif|webp|avif|ico|css|js|woff2?|txt|xml|pdf)$).*)",
  ],
};
