import type { Metadata } from "next";
import Link from "next/link";
import Form from "next/form";
import { Suspense } from "react";
import { ChevronRight, FileText, Landmark, Newspaper, Scale, Search, Ship, Warehouse } from "lucide-react";
import { getDictionary, href, resolveLocale, type Dictionary, type Locale } from "@/lib/i18n";
import { formatNumber } from "@/lib/i18n/format";
import { pageMetadata } from "@/lib/seo";
import { searchSite } from "@/lib/data/public";
import type { SearchHit } from "@/lib/types";
import { Container } from "@/components/ui/container";
import { EmptyState } from "@/components/ui/empty-state";

export async function generateMetadata({ params }: PageProps<"/[locale]/search">): Promise<Metadata> {
  const locale = await resolveLocale(params);
  const t = getDictionary(locale);
  return pageMetadata({ locale, path: "/search", title: t.search.title, noIndex: true });
}

const ICONS = { post: Newspaper, page: FileText, document: FileText, yard: Warehouse, vessel: Ship, compliance: Scale } as const;

function hitHref(locale: Locale, hit: SearchHit): string {
  switch (hit.kind) {
    case "post":
      return href(locale, `/news/${hit.slug}`);
    case "yard":
      return href(locale, `/yards/${hit.slug}`);
    case "vessel":
      return href(locale, `/vessels/${hit.id}`);
    case "document":
      return href(locale, `/publications?q=${encodeURIComponent(hit.title_en)}`);
    case "compliance":
      return href(locale, "/compliance");
    case "page": {
      const map: Record<string, string> = {
        "waste-management": "/waste-management",
        safety: "/safety",
        labour: "/labour",
        "compliance-overview": "/compliance",
        "our-compliances": "/compliance/our-compliances",
        tides: "/tides",
        csr: "/csr",
        international: "/international",
        "privacy-policy": "/privacy",
        "terms-of-use": "/terms",
      };
      if (hit.slug?.startsWith("about-")) return href(locale, `/about#${hit.slug.replace("about-", "")}`);
      return href(locale, map[hit.slug ?? ""] ?? "/about");
    }
  }
}

export default async function SearchPage({ params, searchParams }: PageProps<"/[locale]/search">) {
  const locale = await resolveLocale(params);
  const t = getDictionary(locale);
  return (
    <Container size="narrow" className="py-16 sm:py-24">
      <p className="text-eyebrow text-fg-subtle">{t.search.eyebrow}</p>
      <h1 className="text-headline mt-3">{t.search.title}</h1>
      <Suspense fallback={<div className="skeleton mt-10 h-14 rounded-2xl" />}>
        <Results locale={locale} t={t} searchParams={searchParams} />
      </Suspense>
    </Container>
  );
}

async function Results({ locale, t, searchParams }: { locale: Locale; t: Dictionary; searchParams: PageProps<"/[locale]/search">["searchParams"] }) {
  const sp = await searchParams;
  const q = (Array.isArray(sp.q) ? sp.q[0] : sp.q)?.trim().slice(0, 100) ?? "";
  const hits = q ? await searchSite(q) : [];

  return (
    <>
      <Form action={href(locale, "/search")} className="relative mt-10" role="search">
        <Search className="pointer-events-none absolute top-1/2 left-5 size-5 -translate-y-1/2 text-fg-subtle" />
        <input
          type="search"
          name="q"
          defaultValue={q}
          placeholder={t.search.placeholder}
          aria-label={t.search.placeholder}
          autoFocus={!q}
          className="h-14 w-full rounded-2xl bg-bg-subtle pr-5 pl-14 text-[1.125rem] tracking-[-0.015em] text-fg placeholder:text-fg-faint focus:bg-surface focus:shadow-[0_0_0_4px_var(--brand-ring),inset_0_0_0_1px_var(--brand)] focus:outline-none"
        />
      </Form>
      {!q ? (
        <p className="mt-4 text-[0.9375rem] text-fg-subtle">{t.search.hint}</p>
      ) : hits.length === 0 ? (
        <EmptyState className="mt-10" icon={<Landmark />} title={`${t.search.empty} “${q}”`} body={t.search.hint} />
      ) : (
        <>
          <p className="mt-8 text-[0.875rem] text-fg-subtle tabular">
            {formatNumber(locale, hits.length)} {hits.length === 1 ? t.common.result : t.common.results} · {t.search.resultsFor} “{q}”
          </p>
          <ul className="mt-4 divide-y divide-line">
            {hits.map((hit) => {
              const Icon = ICONS[hit.kind];
              const title = locale === "bn" && hit.title_bn ? hit.title_bn : hit.title_en;
              const snippet = locale === "bn" && hit.snippet_bn ? hit.snippet_bn : hit.snippet_en;
              return (
                <li key={`${hit.kind}-${hit.id}`}>
                  <Link href={hitHref(locale, hit)} className="group flex items-start gap-4 py-5">
                    <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-bg-muted text-fg-subtle">
                      <Icon className="size-[1.125rem]" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="text-[0.75rem] font-medium text-brand">{t.search.kinds[hit.kind]}</span>
                      <span className="mt-0.5 block text-[1.0625rem] leading-snug font-semibold text-fg group-hover:text-link">{title}</span>
                      {snippet && <span className="mt-1 line-clamp-2 block text-[0.875rem] text-fg-subtle">{snippet}</span>}
                    </span>
                    <ChevronRight className="mt-3 size-4 shrink-0 text-fg-faint group-hover:text-fg" />
                  </Link>
                </li>
              );
            })}
          </ul>
        </>
      )}
    </>
  );
}
