import { ExternalLink } from "lucide-react";
import type { Dictionary } from "@/lib/i18n";
import type { Locale } from "@/lib/i18n/config";
import { tr } from "@/lib/i18n/tr";
import { formatDate } from "@/lib/i18n/format";
import type { ComplianceItem } from "@/lib/types";
import { complianceStatusTone } from "@/lib/tones";
import { Badge } from "@/components/ui/badge";
import { Markdown } from "@/components/ui/markdown";

export function ComplianceCard({ item, locale, t }: { item: ComplianceItem; locale: Locale; t: Dictionary }) {
  return (
    <article className="flex h-full flex-col rounded-[var(--radius-card)] bg-surface p-6 hairline">
      <div className="flex items-start justify-between gap-3">
        <Badge tone={complianceStatusTone[item.status]} dot>
          {t.labels.complianceStatus[item.status]}
        </Badge>
        {item.effective_date && (
          <span className="text-[0.75rem] text-fg-subtle tabular">
            {t.compliance.effective} {formatDate(locale, item.effective_date, "medium")}
          </span>
        )}
      </div>
      <h3 className="mt-4 text-[1.125rem] leading-snug font-semibold tracking-[-0.018em] text-balance">{tr(item, "title", locale)}</h3>
      {item.summary_en && <p className="mt-2 text-[0.9375rem] text-fg-subtle">{tr(item, "summary", locale)}</p>}
      {item.body_en && <Markdown compact className="mt-3 text-[0.9375rem]">{tr(item, "body", locale)}</Markdown>}
      <div className="mt-auto flex flex-wrap items-center justify-between gap-3 pt-5 text-[0.8125rem]">
        {item.authority && (
          <span className="text-fg-subtle">
            {t.compliance.authority}: <span className="font-medium text-fg-muted">{item.authority}</span>
          </span>
        )}
        {item.reference_url && (
          <a
            href={item.reference_url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 font-medium text-link hover:underline"
          >
            {t.compliance.reference}
            <ExternalLink className="size-3.5" />
          </a>
        )}
      </div>
    </article>
  );
}
