import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { FileSearch, LockKeyhole } from "lucide-react";
import { getDictionary, href, resolveLocale, type Dictionary, type Locale } from "@/lib/i18n";
import { formatNumber, localizeDigits } from "@/lib/i18n/format";
import { pageMetadata } from "@/lib/seo";
import { getDocumentYears, getPublicDocuments } from "@/lib/data/public";
import type { DocumentCategory } from "@/lib/types";
import { PageHero } from "@/components/site/page-hero";
import { Container } from "@/components/ui/container";
import { FilterForm } from "@/components/site/filter-form";
import { DocumentRow } from "@/components/site/document-row";
import { EmptyState } from "@/components/ui/empty-state";
import { Pagination } from "@/components/ui/pagination";

export async function generateMetadata({ params }: PageProps<"/[locale]/publications">): Promise<Metadata> {
  const locale = await resolveLocale(params);
  const t = getDictionary(locale);
  return pageMetadata({ locale, path: "/publications", title: t.nav.publications, description: t.publications.lede });
}

const CATEGORIES: DocumentCategory[] = [
  "publication", "annual_report", "industry_report", "guideline", "policy", "circular",
  "notice", "form", "research_paper", "law_regulation", "other",
];

export default async function PublicationsPage({ params, searchParams }: PageProps<"/[locale]/publications">) {
  const locale = await resolveLocale(params);
  const t = getDictionary(locale);
  return (
    <>
      <PageHero eyebrow={t.publications.eyebrow} title={t.publications.title} lede={t.publications.lede} />
      <Container className="pb-24">
        <Suspense fallback={<div className="skeleton h-[560px] rounded-[var(--radius-tile)]" />}>
          <DocumentList locale={locale} t={t} searchParams={searchParams} />
        </Suspense>
      </Container>
    </>
  );
}

async function DocumentList({
  locale,
  t,
  searchParams,
}: {
  locale: Locale;
  t: Dictionary;
  searchParams: PageProps<"/[locale]/publications">["searchParams"];
}) {
  const sp = await searchParams;
  const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v)?.trim() ?? "";
  const q = one(sp.q);
  const category = CATEGORIES.includes(one(sp.category) as DocumentCategory) ? (one(sp.category) as DocumentCategory) : null;
  const year = /^\d{4}$/.test(one(sp.year)) ? Number(one(sp.year)) : null;
  const page = Math.max(1, Number(one(sp.page)) || 1);
  const pageSize = 15;
  const [years, { rows, count }] = await Promise.all([
    getDocumentYears(),
    getPublicDocuments({ q, category, year, page, pageSize }),
  ]);
  const path = href(locale, "/publications");
  const p = t.publications;

  return (
    <>
      <FilterForm
        action={path}
        search={{ name: "q", value: q, placeholder: p.searchPlaceholder }}
        labels={{ apply: t.common.apply, clear: t.common.clear, search: t.common.search }}
        selects={[
          { name: "category", label: t.common.category, value: category ?? "", options: [{ value: "", label: p.allCategories }, ...CATEGORIES.map((c) => ({ value: c, label: t.labels.documentCategory[c] }))] },
          { name: "year", label: t.common.year, value: year ? String(year) : "", options: [{ value: "", label: p.allYears }, ...years.map((y) => ({ value: String(y), label: localizeDigits(locale, y) }))] },
        ]}
      />
      <p className="mt-6 text-[0.875rem] text-fg-subtle tabular">
        {formatNumber(locale, count)} {count === 1 ? t.common.result : t.common.results}
      </p>
      {rows.length === 0 ? (
        <EmptyState className="mt-6" icon={<FileSearch />} title={p.empty} body={t.common.noResultsHint} />
      ) : (
        <ul className="mt-2">
          {rows.map((doc) => (
            <DocumentRow key={doc.id} doc={doc} locale={locale} t={t} />
          ))}
        </ul>
      )}
      <Pagination
        path={path}
        params={{ q, category, year }}
        page={page}
        totalPages={Math.ceil(count / pageSize)}
        labels={{ previous: t.common.previous, next: t.common.next, page: t.common.page, of: t.common.of }}
      />
      <div className="mt-12 flex items-center gap-3 rounded-[var(--radius-card)] bg-bg-subtle p-5 text-[0.9375rem] text-fg-muted">
        <LockKeyhole className="size-5 shrink-0 text-brand" />
        <p>
          {p.membersHint}{" "}
          <Link href={href(locale, "/portal/documents")} className="font-medium text-link hover:underline">
            {t.nav.signIn}
          </Link>
        </p>
      </div>
    </>
  );
}
