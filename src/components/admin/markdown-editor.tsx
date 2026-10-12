"use client";

import { useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Bold, Heading2, Italic, Link2, List, ListOrdered, Quote } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * A friendly Markdown editor for non-technical editors: formatting buttons,
 * keyboard shortcuts (⌘B / ⌘I) and a live preview that matches the site.
 */
export function MarkdownEditor({
  id,
  value,
  onChange,
  lang,
  invalid,
  placeholder,
}: {
  id: string;
  value: string;
  onChange: (value: string) => void;
  lang?: string;
  invalid?: boolean;
  placeholder?: string;
}) {
  const ref = useRef<HTMLTextAreaElement>(null);
  const [mode, setMode] = useState<"write" | "preview">("write");

  const wrap = (before: string, after = before, placeholderText = "text") => {
    const el = ref.current;
    if (!el) return;
    const { selectionStart: s, selectionEnd: e } = el;
    const selected = value.slice(s, e) || placeholderText;
    const next = value.slice(0, s) + before + selected + after + value.slice(e);
    onChange(next);
    requestAnimationFrame(() => {
      el.focus();
      el.setSelectionRange(s + before.length, s + before.length + selected.length);
    });
  };

  const prefixLines = (prefix: (i: number) => string) => {
    const el = ref.current;
    if (!el) return;
    const { selectionStart: s, selectionEnd: e } = el;
    const lineStart = value.lastIndexOf("\n", s - 1) + 1;
    const block = value.slice(lineStart, e) || "";
    const lines = (block || "item").split("\n").map((line, i) => `${prefix(i)}${line.replace(/^(#{1,6}\s|[-*]\s|\d+\.\s|>\s)/, "")}`);
    onChange(value.slice(0, lineStart) + lines.join("\n") + value.slice(e));
    requestAnimationFrame(() => el.focus());
  };

  const tools = [
    { id: "h2", icon: Heading2, label: "Section heading" },
    { id: "bold", icon: Bold, label: "Bold (⌘B)" },
    { id: "italic", icon: Italic, label: "Italic (⌘I)" },
    { id: "ul", icon: List, label: "Bulleted list" },
    { id: "ol", icon: ListOrdered, label: "Numbered list" },
    { id: "quote", icon: Quote, label: "Quote" },
    { id: "link", icon: Link2, label: "Link" },
  ] as const;

  const apply = (id: (typeof tools)[number]["id"]) => {
    switch (id) {
      case "h2":
        return prefixLines(() => "## ");
      case "bold":
        return wrap("**");
      case "italic":
        return wrap("*");
      case "ul":
        return prefixLines(() => "- ");
      case "ol":
        return prefixLines((i) => `${i + 1}. `);
      case "quote":
        return prefixLines(() => "> ");
      case "link":
        return wrap("[", "](https://)", "link text");
    }
  };

  return (
    <div className={cn("overflow-hidden rounded-xl bg-surface hairline", invalid && "shadow-[inset_0_0_0_1px_var(--danger)]")}>
      <div className="flex items-center justify-between gap-2 border-b border-line bg-bg-subtle px-2 py-1.5">
        <div className="flex items-center gap-0.5">
          {tools.map(({ id, icon: Icon, label }) => (
            <button
              key={id}
              type="button"
              onClick={() => apply(id)}
              disabled={mode === "preview"}
              title={label}
              aria-label={label}
              className="grid size-8 place-items-center rounded-lg text-fg-muted hover:bg-bg-muted hover:text-fg disabled:opacity-30"
            >
              <Icon className="size-4" />
            </button>
          ))}
        </div>
        <div className="flex rounded-lg bg-bg-muted p-0.5 text-[0.75rem] font-medium">
          {(["write", "preview"] as const).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => setMode(m)}
              className={cn("rounded-md px-2.5 py-1 capitalize", mode === m ? "bg-surface text-fg shadow-sm" : "text-fg-subtle")}
            >
              {m}
            </button>
          ))}
        </div>
      </div>
      {mode === "write" ? (
        <textarea
          ref={ref}
          id={id}
          lang={lang}
          value={value}
          placeholder={placeholder}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={(e) => {
            if (!(e.metaKey || e.ctrlKey)) return;
            if (e.key === "b") {
              e.preventDefault();
              wrap("**");
            } else if (e.key === "i") {
              e.preventDefault();
              wrap("*");
            }
          }}
          className="block min-h-72 w-full resize-y bg-transparent px-4 py-3 font-mono text-[0.875rem] leading-relaxed text-fg focus:outline-none"
        />
      ) : (
        <div lang={lang} className="prose-bsbra min-h-72 px-5 py-4">
          {value.trim() ? (
            <ReactMarkdown remarkPlugins={[remarkGfm]} skipHtml components={{ img: () => null }}>
              {value}
            </ReactMarkdown>
          ) : (
            <p className="text-fg-faint">Nothing to preview yet.</p>
          )}
        </div>
      )}
    </div>
  );
}
