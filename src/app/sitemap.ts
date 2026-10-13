import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/env";
import { locales } from "@/lib/i18n/config";
import { getAlbums, getLatestPosts, getYards, POST_GROUPS } from "@/lib/data/public";

const STATIC_PATHS = [
  "", "/about", "/leadership", "/industry", "/vessels", "/yards", "/tides", "/compliance",
  "/compliance/our-compliances", "/waste-management", "/safety", "/labour", "/csr", "/news",
  "/press", "/international", "/publications", "/gallery", "/links", "/contact", "/privacy", "/terms", "/credits",
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [yards, posts, albums] = await Promise.all([
    getYards(),
    getLatestPosts([...POST_GROUPS.newsroom, ...POST_GROUPS.press, ...POST_GROUPS.international, ...POST_GROUPS.csr], 500),
    getAlbums(),
  ]);

  const entry = (path: string, lastModified?: string, priority = 0.6): MetadataRoute.Sitemap[number] => ({
    url: `${SITE_URL}/en${path}`,
    lastModified,
    priority,
    alternates: { languages: Object.fromEntries(locales.map((l) => [l === "bn" ? "bn-BD" : "en", `${SITE_URL}/${l}${path}`])) },
  });

  return [
    ...STATIC_PATHS.map((p) => entry(p, undefined, p === "" ? 1 : 0.8)),
    ...yards.map((y) => entry(`/yards/${y.slug}`, y.updated_at)),
    ...posts.filter((p) => p.body_en).map((p) => entry(`/news/${p.slug}`, p.updated_at, 0.5)),
    ...albums.map((a) => entry(`/gallery/${a.slug}`, a.updated_at, 0.4)),
  ];
}
