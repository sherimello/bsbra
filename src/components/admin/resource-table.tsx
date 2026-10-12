import Link from "next/link";
import { ArrowDown, ArrowUp, Check, Minus } from "lucide-react";
import type { ResourceConfig } from "@/lib/admin/resources";
import { mediaUrl } from "@/lib/env";
import { formatDate, formatNumber } from "@/lib/i18n/format";
import { accessLevelTone, publishStatusTone } from "@/lib/tones";
import type { AccessLevel, PublishStatus } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { withParams } from "@/components/ui/pagination";

type Row = Record<string, unknown> & { id: string };

const STATUS_LABEL: Record<string, string> = { draft: "Draft", review: "In review", published: "Published", archived: "Archived" };
const ACCESS_LABEL: Record<string, string> = { public: "Public", corporate: "Corporate", members: "Members", internal: "Internal" };

export function ResourceTable({
  resource,
  rows,
  relationLabels,
  sort,
  params,
}: {
  resource: ResourceConfig;
  rows: Row[];
  relationLabels: Record<string, Map<string, string>>;
  sort: { col: string; ascending: boolean };
  params: Record<string, string | undefined>;
}) {
  const base = `/admin/${resource.key}`;

  const cell = (row: Row, col: ResourceConfig["columns"][number]) => {
    const v = row[col.name];
    switch (col.kind) {
      case "title":
        return (
          <Link href={`${base}/${row.id}`} className="font-semibold text-fg hover:text-link">
            {v === null || v === undefined || v === "" ? <span className="text-fg-faint">Untitled</span> : String(v)}
          </Link>
        );
      case "badge": {
        const label = col.options?.find((o) => o.value === v)?.label ?? String(v ?? "—");
        return v ? <Badge>{label}</Badge> : <span className="text-fg-faint">—</span>;
      }
      case "status":
        return <Badge tone={publishStatusTone[v as PublishStatus] ?? "neutral"} dot>{STATUS_LABEL[String(v)] ?? String(v)}</Badge>;
      case "access":
        return <Badge tone={accessLevelTone[v as AccessLevel] ?? "neutral"}>{ACCESS_LABEL[String(v)] ?? String(v)}</Badge>;
      case "date":
        return v ? <span className="tabular">{formatDate("en", String(v), "medium")}</span> : <span className="text-fg-faint">—</span>;
      case "datetime":
        return v ? (
          <span className="tabular">
            {formatDate("en", String(v), "medium")} · {formatDate("en", String(v), "time")}
          </span>
        ) : (
          <span className="text-fg-faint">—</span>
        );
      case "number":
        return <span className="tabular">{formatNumber("en", v as number)}</span>;
      case "boolean":
        return v ? <Check className="size-4 text-ok" aria-label="Yes" /> : <Minus className="size-4 text-fg-faint" aria-label="No" />;
      case "image": {
        const url = mediaUrl(v as string);
        return (
          <span className="relative block size-10 overflow-hidden rounded-lg bg-bg-muted">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            {url && <img src={url} alt="" className="absolute inset-0 h-full w-full object-cover" />}
          </span>
        );
      }
      case "relation":
        return relationLabels[col.name]?.get(String(v)) ?? <span className="text-fg-faint">—</span>;
      default:
        return v === null || v === undefined || v === "" ? <span className="text-fg-faint">—</span> : <span className="line-clamp-1">{String(v)}</span>;
    }
  };

  return (
    <div className="overflow-x-auto rounded-[var(--radius-card)] bg-surface hairline">
      <table className="w-full min-w-[720px] text-left text-[0.875rem]">
        <thead>
          <tr>
            {resource.columns.map((col) => {
              const active = sort.col === col.name;
              const nextDir = active && sort.ascending ? "desc" : "asc";
              return (
                <th
                  key={col.name}
                  scope="col"
                  className={cn(
                    "border-b border-line bg-bg-subtle px-4 py-2.5 text-[0.75rem] font-semibold whitespace-nowrap text-fg-subtle",
                    col.numeric && "text-right",
                    col.kind === "image" && "w-14",
                  )}
                >
                  {col.label ? (
                    <Link
                      href={withParams(base, { ...params, sort: col.name, dir: nextDir, page: undefined })}
                      className={cn("inline-flex items-center gap-1 hover:text-fg", active && "text-fg")}
                    >
                      {col.label}
                      {active && (sort.ascending ? <ArrowUp className="size-3" /> : <ArrowDown className="size-3" />)}
                    </Link>
                  ) : null}
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.id} className="border-b border-line transition-colors last:border-0 hover:bg-bg-subtle/60">
              {resource.columns.map((col) => (
                <td key={col.name} className={cn("px-4 py-2.5 align-middle text-fg-muted", col.numeric && "text-right tabular")}>
                  {cell(row, col)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
