import { Download, ExternalLink, FileText, Lock } from "lucide-react";
import type { Dictionary } from "@/lib/i18n";
import type { Locale } from "@/lib/i18n/config";
import { tr } from "@/lib/i18n/tr";
import { formatDate, localizeDigits } from "@/lib/i18n/format";
import type { DocumentRecord } from "@/lib/types";
import { accessLevelTone } from "@/lib/tones";
import { formatBytes } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

export function documentHref(doc: Pick<DocumentRecord, "id" | "file_path" | "external_url">) {
  return doc.file_path ? `/api/documents/${doc.id}` : (doc.external_url ?? "#");
}

export function DocumentRow({ doc, locale, t }: { doc: DocumentRecord; locale: Locale; t: Dictionary }) {
  const external = !doc.file_path && !!doc.external_url;
  const restricted = doc.access_level !== "public";
  return (
    <li className="group flex flex-col gap-4 border-b border-line py-5 last:border-0 sm:flex-row sm:items-center">
      <div className="grid size-12 shrink-0 place-items-center rounded-2xl bg-brand-soft text-brand">
        <FileText className="size-5" strokeWidth={1.8} />
      </div>
      <div className="min-w-0 flex-1">
        <div className="mb-1 flex flex-wrap items-center gap-2 text-[0.75rem] text-fg-subtle">
          <Badge>{t.labels.documentCategory[doc.category]}</Badge>
          {doc.year && <span className="tabular">{localizeDigits(locale, doc.year)}</span>}
          {doc.published_on && <span>· {formatDate(locale, doc.published_on, "medium")}</span>}
          {restricted && (
            <Badge tone={accessLevelTone[doc.access_level]}>
              <Lock className="size-3" />
              {t.labels.accessLevel[doc.access_level]}
            </Badge>
          )}
        </div>
        <h3 className="text-[1.0625rem] leading-snug font-semibold tracking-[-0.015em] text-fg">{tr(doc, "title", locale)}</h3>
        {doc.description_en && <p className="mt-1 line-clamp-2 text-[0.875rem] text-fg-subtle">{tr(doc, "description", locale)}</p>}
      </div>
      <a
        href={documentHref(doc)}
        {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
        className="press inline-flex h-10 shrink-0 items-center gap-2 self-start rounded-full bg-bg-muted px-4 text-[0.875rem] font-medium text-fg transition-colors hover:bg-fg hover:text-bg sm:self-center"
      >
        {external ? <ExternalLink className="size-4" /> : <Download className="size-4" />}
        {external ? t.common.open : t.common.download}
        {doc.file_size ? <span className="font-normal opacity-60">{formatBytes(doc.file_size)}</span> : null}
      </a>
    </li>
  );
}
