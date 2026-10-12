import type { MetadataRoute } from "next";
import { SITE_URL, isPreviewMode } from "@/lib/env";

export default function robots(): MetadataRoute.Robots {
  // Keep preview deployments (sample content) out of search engines.
  if (isPreviewMode) return { rules: { userAgent: "*", disallow: "/" } };
  return {
    rules: { userAgent: "*", allow: "/", disallow: ["/admin", "/api", "/auth", "/en/portal", "/bn/portal"] },
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
