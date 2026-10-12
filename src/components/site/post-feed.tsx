import { Newspaper } from "lucide-react";
import type { Dictionary } from "@/lib/i18n";
import type { Locale } from "@/lib/i18n/config";
import type { PostType } from "@/lib/types";
import { getPosts } from "@/lib/data/public";
import { FilterPills } from "@/components/ui/filter-pills";
import { EmptyState } from "@/components/ui/empty-state";
import { Pagination } from "@/components/ui/pagination";
import { RevealGroup, RevealItem } from "@/components/motion/reveal";
import { PostCard } from "./post-card";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

function first(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

/**
 * A filterable, paginated grid of posts. Reads searchParams, so render it
 * inside <Suspense>. Filters: ?type=… (or ?area=… for CSR) and ?page=….
 */
export async function PostFeed({
  locale,
  t,
  path,
  types,
  searchParams,
  filter = "type",
  emptyText,
}: {
  locale: Locale;
  t: Dictionary;
  path: string;
  types: PostType[];
  searchParams: SearchParams;
  filter?: "type" | "csr" | "none";
  emptyText: string;
}) {
  const sp = await searchParams;
  const page = Math.max(1, Number(first(sp.page)) || 1);
  const type = filter === "type" && types.includes(first(sp.type) as PostType) ? (first(sp.type) as PostType) : null;
  const csrAreas = Object.keys(t.labels.csrArea) as (keyof Dictionary["labels"]["csrArea"])[];
  const area = filter === "csr" && csrAreas.includes(first(sp.area) as never) ? (first(sp.area) as string) : null;
  const pageSize = 12;
  const { rows, count } = await getPosts({ types, type, csrArea: area, page, pageSize });

  return (
    <>
      {filter === "type" && types.length > 1 && (
        <FilterPills
          label={t.common.filter}
          className="mb-10"
          items={[
            { label: t.news.allTypes, href: path, active: !type },
            ...types.map((x) => ({ label: t.labels.postType[x], href: `${path}?type=${x}`, active: type === x })),
          ]}
        />
      )}
      {filter === "csr" && (
        <FilterPills
          label={t.common.filter}
          className="mb-10"
          items={[
            { label: t.csr.allAreas, href: path, active: !area },
            ...csrAreas.map((x) => ({ label: t.labels.csrArea[x], href: `${path}?area=${x}`, active: area === x })),
          ]}
        />
      )}
      {rows.length === 0 ? (
        <EmptyState icon={<Newspaper />} title={emptyText} />
      ) : (
        <RevealGroup className="grid gap-x-6 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
          {rows.map((post) => (
            <RevealItem key={post.id}>
              <PostCard post={post} locale={locale} t={t} />
            </RevealItem>
          ))}
        </RevealGroup>
      )}
      <Pagination
        path={path}
        params={{ type: type ?? undefined, area: area ?? undefined }}
        page={page}
        totalPages={Math.ceil(count / pageSize)}
        labels={{ previous: t.common.previous, next: t.common.next, page: t.common.page, of: t.common.of }}
      />
    </>
  );
}

export function FeedSkeleton() {
  return (
    <div aria-hidden className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 6 }, (_, i) => (
        <div key={i}>
          <div className="skeleton aspect-[3/2] rounded-[var(--radius-card)]" />
          <div className="skeleton mt-5 h-5 w-2/3 rounded-full" />
          <div className="skeleton mt-3 h-4 w-full rounded-full" />
        </div>
      ))}
    </div>
  );
}
