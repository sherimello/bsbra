import ReactMarkdown, { type Components } from "react-markdown";
import remarkGfm from "remark-gfm";
import { cn } from "@/lib/utils";

const components: Components = {
  a({ href, children, ...props }) {
    const external = !!href && /^https?:\/\//.test(href);
    return (
      <a href={href} {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})} {...props}>
        {children}
      </a>
    );
  },
  // Raw images are not allowed in CMS bodies; use the cover/gallery fields instead.
  img: () => null,
};

/**
 * Renders CMS Markdown safely: raw HTML is never interpreted, so editors
 * cannot inject scripts or markup.
 */
export function Markdown({ children, className, compact }: { children: string | null | undefined; className?: string; compact?: boolean }) {
  if (!children?.trim()) return null;
  return (
    <div className={cn("prose-bsbra", compact && "prose-compact", className)}>
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={components} skipHtml>
        {children}
      </ReactMarkdown>
    </div>
  );
}

export interface MarkdownSection {
  id: string;
  title: string;
  body: string;
}

/** Splits Markdown at level-2 headings: intro text plus one section per “## …”. */
export function splitMarkdownSections(markdown: string | null | undefined): { intro: string; sections: MarkdownSection[] } {
  const source = (markdown ?? "").replace(/\r\n/g, "\n");
  const parts = source.split(/^##\s+(.+)$/m);
  const intro = parts[0]?.trim() ?? "";
  const sections: MarkdownSection[] = [];
  const used = new Set<string>();
  for (let i = 1; i < parts.length; i += 2) {
    const title = parts[i].trim();
    let id =
      title
        .toLowerCase()
        .normalize("NFKD")
        .replace(/[^\p{L}\p{N}]+/gu, "-")
        .replace(/^-+|-+$/g, "") || `section-${sections.length + 1}`;
    while (used.has(id)) id = `${id}-${sections.length + 1}`;
    used.add(id);
    sections.push({ id, title, body: (parts[i + 1] ?? "").trim() });
  }
  return { intro, sections };
}

/** Plain-text excerpt from Markdown, for meta descriptions and cards. */
export function markdownExcerpt(markdown: string | null | undefined, length = 180): string {
  const text = (markdown ?? "")
    .replace(/^#+\s+/gm, "")
    .replace(/[*_`>#-]/g, "")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/\s+/g, " ")
    .trim();
  return text.length > length ? `${text.slice(0, length - 1).trimEnd()}…` : text;
}
