"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { toast } from "sonner";
import { Check, CircleAlert } from "lucide-react";
import type { FieldConfig, Option } from "@/lib/admin/resources";
import type { ActionResult } from "@/lib/admin/actions";
import { cn, isValidImo, slugify } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { FieldError, FieldHint, Input, Label, Select, Textarea } from "@/components/ui/field";
import { Switch } from "./switch";
import { MarkdownEditor } from "./markdown-editor";
import { FileField, ImageField, ImagesField, type FileValue } from "./upload-fields";

type Values = Record<string, unknown>;

function withoutKey<T extends Record<string, unknown>>(obj: T, key: string): T {
  const next = { ...obj };
  delete next[key];
  return next;
}

function toLocalInput(iso: unknown): string {
  if (typeof iso !== "string" || !iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function ResourceForm({
  fields,
  initial,
  relationOptions,
  folder,
  canPublish = true,
  canEdit = true,
  submitLabel,
  onSubmit,
  onSaved,
}: {
  fields: FieldConfig[];
  initial: Values;
  relationOptions: Record<string, Option[]>;
  folder: string;
  canPublish?: boolean;
  canEdit?: boolean;
  submitLabel: string;
  onSubmit: (values: Values) => Promise<ActionResult>;
  onSaved?: (result: ActionResult) => void;
}) {
  const router = useRouter();
  const [values, setValues] = useState<Values>(initial);
  const [baseline, setBaseline] = useState(() => JSON.stringify(initial));
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [pending, startTransition] = useTransition();
  const slugTouched = useRef(Boolean(initial.slug));
  const formRef = useRef<HTMLFormElement>(null);
  const dirty = JSON.stringify(values) !== baseline;

  useEffect(() => {
    if (!dirty) return;
    const warn = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "s") {
        e.preventDefault();
        formRef.current?.requestSubmit();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const set = (column: string, value: unknown) => {
    setValues((prev) => {
      const next = { ...prev, [column]: value };
      // Keep the slug in step with its source until the editor edits it by hand.
      const slugField = fields.find((f) => f.type === "slug" && f.from === column);
      if (slugField && !slugTouched.current) next[slugField.name] = slugify(String(value ?? ""), "");
      return next;
    });
    if (errors[column]) setErrors((prev) => withoutKey(prev, column));
  };

  const sections = useMemo(() => {
    const order: string[] = [];
    const map = new Map<string, FieldConfig[]>();
    for (const f of fields) {
      const key = f.section ?? "Details";
      if (!map.has(key)) {
        map.set(key, []);
        order.push(key);
      }
      map.get(key)!.push(f);
    }
    return order.map((name) => ({ name, fields: map.get(name)! }));
  }, [fields]);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    startTransition(async () => {
      const result = await onSubmit(values);
      if (result.ok) {
        setErrors({});
        setBaseline(JSON.stringify(values));
        toast.success("Saved");
        onSaved?.(result);
        router.refresh();
      } else {
        setErrors(result.fieldErrors ?? {});
        toast.error(result.error ?? "Could not save.");
        const first = Object.keys(result.fieldErrors ?? {})[0];
        if (first) document.getElementById(`f-${first}`)?.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    });
  };

  const control = (f: FieldConfig, column: string, lang?: "en" | "bn") => {
    const id = `f-${column}`;
    const v = values[column];
    const invalid = errors[column] ? true : undefined;
    const disabled = !canEdit || f.readOnly;
    const langAttr = lang === "bn" ? "bn" : undefined;

    switch (f.type) {
      case "textarea":
        return <Textarea id={id} lang={langAttr} value={String(v ?? "")} onChange={(e) => set(column, e.target.value)} rows={f.readOnly ? 6 : 3} disabled={disabled} aria-invalid={invalid} placeholder={f.placeholder} />;
      case "markdown":
        return <MarkdownEditor id={id} lang={langAttr} value={String(v ?? "")} onChange={(x) => set(column, x)} invalid={!!invalid} placeholder={f.placeholder} />;
      case "list":
        return (
          <Textarea
            id={id}
            lang={langAttr}
            rows={5}
            value={(Array.isArray(v) ? v : []).join("\n")}
            onChange={(e) => set(column, e.target.value.split("\n"))}
            disabled={disabled}
            aria-invalid={invalid}
          />
        );
      case "select":
      case "relation": {
        const options = f.type === "relation" ? (relationOptions[f.name] ?? []) : (f.options ?? []);
        const allowed = f.name === "status" && !canPublish ? options.filter((o) => ["draft", "review"].includes(o.value) || o.value === v) : options;
        return (
          <Select id={id} value={String(v ?? "")} onChange={(e) => set(column, e.target.value)} disabled={disabled} aria-invalid={invalid}>
            {!f.required && <option value="">—</option>}
            {allowed.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </Select>
        );
      }
      case "boolean":
        return (
          <div className="flex h-11 items-center">
            <Switch id={id} label={f.label} checked={Boolean(v)} onChange={(x) => set(column, x)} disabled={disabled} />
          </div>
        );
      case "number":
      case "decimal":
        return (
          <Input
            id={id}
            type="number"
            inputMode={f.type === "number" ? "numeric" : "decimal"}
            step={f.type === "number" ? 1 : "any"}
            min={f.min}
            max={f.max}
            value={v === null || v === undefined ? "" : String(v)}
            onChange={(e) => set(column, e.target.value)}
            disabled={disabled}
            aria-invalid={invalid}
            className="tabular"
          />
        );
      case "date":
        return <Input id={id} type="date" value={String(v ?? "").slice(0, 10)} onChange={(e) => set(column, e.target.value)} disabled={disabled} aria-invalid={invalid} />;
      case "datetime":
        return (
          <Input
            id={id}
            type="datetime-local"
            value={toLocalInput(v)}
            onChange={(e) => set(column, e.target.value ? new Date(e.target.value).toISOString() : "")}
            disabled={disabled}
            aria-invalid={invalid}
          />
        );
      case "time":
        return <Input id={id} type="time" value={String(v ?? "").slice(0, 5)} onChange={(e) => set(column, e.target.value)} disabled={disabled} aria-invalid={invalid} />;
      case "image":
        return <ImageField id={id} value={(v as string) || null} onChange={(x) => set(column, x)} folder={folder} disabled={disabled} />;
      case "images":
        return <ImagesField id={id} value={Array.isArray(v) ? (v as string[]) : []} onChange={(x) => set(column, x)} folder={folder} disabled={disabled} />;
      case "file": {
        const cols = f.fileColumns!;
        const fileValue: FileValue = {
          path: (values[column] as string) || null,
          name: (values[cols.name] as string) || null,
          size: (values[cols.size] as number) || null,
          mime: (values[cols.mime] as string) || null,
        };
        return (
          <FileField
            id={id}
            value={fileValue}
            bucket={f.bucket === "minutes" ? "minutes" : "documents"}
            folder={folder}
            disabled={disabled}
            onChange={(fv) => {
              setValues((prev) => ({ ...prev, [column]: fv.path ?? "", [cols.name]: fv.name, [cols.size]: fv.size, [cols.mime]: fv.mime }));
              if (errors[column]) setErrors((prev) => withoutKey(prev, column));
            }}
          />
        );
      }
      case "imo": {
        const s = String(v ?? "");
        const ok = s.length === 7 && isValidImo(s);
        return (
          <div className="relative">
            <Input
              id={id}
              inputMode="numeric"
              maxLength={7}
              value={s}
              onChange={(e) => set(column, e.target.value.replace(/\D/g, ""))}
              disabled={disabled}
              aria-invalid={invalid ?? (s.length === 7 && !ok ? true : undefined)}
              className="pr-10 tabular"
            />
            {s.length === 7 && (
              <span className="absolute top-1/2 right-3 -translate-y-1/2">
                {ok ? <Check className="size-4 text-ok" /> : <CircleAlert className="size-4 text-danger" />}
              </span>
            )}
          </div>
        );
      }
      default:
        return (
          <Input
            id={id}
            lang={langAttr}
            type={f.type === "email" ? "email" : f.type === "url" ? "url" : "text"}
            value={String(v ?? "")}
            onChange={(e) => {
              if (f.type === "slug") slugTouched.current = true;
              set(column, f.type === "slug" ? e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "-").replace(/-+/g, "-") : e.target.value);
            }}
            placeholder={f.placeholder}
            disabled={disabled}
            aria-invalid={invalid}
            className={f.type === "slug" ? "font-mono text-[0.875rem]" : undefined}
          />
        );
    }
  };

  return (
    <form ref={formRef} onSubmit={submit} noValidate className="space-y-6 pb-24">
      {sections.map((section) => (
        <section key={section.name} className="rounded-[var(--radius-card)] bg-surface p-6 hairline sm:p-8">
          <h2 className="mb-6 text-[1.0625rem] font-semibold tracking-[-0.015em]">{section.name}</h2>
          <div className="grid gap-x-6 gap-y-6 md:grid-cols-2">
            {section.fields.map((f) => {
              if (f.bilingual && f.type === "markdown") return <BilingualMarkdown key={f.name} field={f} control={control} errors={errors} />;
              const wide = f.wide || f.bilingual || f.type === "markdown" || f.type === "images" || f.type === "file";
              return (
                <div key={f.name} className={cn(wide && "md:col-span-2")}>
                  {f.type !== "boolean" || f.bilingual ? (
                    <Label htmlFor={`f-${f.bilingual ? `${f.name}_en` : f.name}`}>
                      {f.label}
                      {f.required && <span className="text-danger"> *</span>}
                    </Label>
                  ) : (
                    <Label htmlFor={`f-${f.name}`}>{f.label}</Label>
                  )}
                  {f.bilingual ? (
                    <div className="grid gap-3 md:grid-cols-2">
                      {(["en", "bn"] as const).map((lang) => (
                        <div key={lang}>
                          <span className="mb-1 block text-[0.6875rem] font-medium text-fg-faint">{lang === "en" ? "English" : "বাংলা"}</span>
                          {control(f, `${f.name}_${lang}`, lang)}
                          <FieldError>{errors[`${f.name}_${lang}`]}</FieldError>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <>
                      {control(f, f.name)}
                      <FieldError>{errors[f.name]}</FieldError>
                    </>
                  )}
                  {f.help && <FieldHint>{f.help}</FieldHint>}
                </div>
              );
            })}
          </div>
        </section>
      ))}

      {canEdit && (
        <div className="glass-strong fixed inset-x-0 bottom-0 z-30 border-t border-line lg:left-64">
          <div className="mx-auto flex max-w-[1280px] items-center justify-between gap-4 px-4 py-3 sm:px-8">
            <p className="text-[0.8125rem] text-fg-subtle">{dirty ? "Unsaved changes · ⌘S to save" : "All changes saved"}</p>
            <Button type="submit" disabled={pending || !dirty}>
              {pending ? "Saving…" : submitLabel}
            </Button>
          </div>
        </div>
      )}
    </form>
  );
}

function BilingualMarkdown({
  field,
  control,
  errors,
}: {
  field: FieldConfig;
  control: (f: FieldConfig, column: string, lang?: "en" | "bn") => React.ReactNode;
  errors: Record<string, string>;
}) {
  const [lang, setLang] = useState<"en" | "bn">("en");
  return (
    <div className="md:col-span-2">
      <div className="mb-1.5 flex items-center justify-between">
        <Label htmlFor={`f-${field.name}_${lang}`} className="mb-0">
          {field.label}
          {field.required && <span className="text-danger"> *</span>}
        </Label>
        <div className="flex rounded-lg bg-bg-muted p-0.5 text-[0.75rem] font-medium">
          {(["en", "bn"] as const).map((l) => (
            <button
              key={l}
              type="button"
              onClick={() => setLang(l)}
              className={cn("rounded-md px-2.5 py-1", lang === l ? "bg-surface text-fg shadow-sm" : "text-fg-subtle")}
            >
              {l === "en" ? "English" : "বাংলা"}
              {errors[`${field.name}_${l}`] && <span className="ml-1 text-danger">•</span>}
            </button>
          ))}
        </div>
      </div>
      {control(field, `${field.name}_${lang}`, lang)}
      <FieldError>{errors[`${field.name}_${lang}`]}</FieldError>
      {field.help && <FieldHint>{field.help}</FieldHint>}
    </div>
  );
}
