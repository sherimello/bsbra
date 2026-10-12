import type { FieldConfig } from "./resources";

type Values = Record<string, unknown>;

/** Initial form values: record values when editing, field defaults when creating. */
export function initialValues(fields: FieldConfig[], record?: Values | null): Values {
  const out: Values = {};
  for (const f of fields) {
    const cols = f.bilingual ? [`${f.name}_en`, `${f.name}_bn`] : [f.name];
    for (const c of cols) {
      const fallback = f.type === "boolean" ? false : f.type === "list" || f.type === "images" ? [] : "";
      out[c] = record ? (record[c] ?? fallback) : (f.defaultValue ?? fallback);
    }
    if (f.type === "file" && f.fileColumns) {
      for (const c of Object.values(f.fileColumns)) out[c] = record?.[c] ?? null;
    }
  }
  return out;
}
