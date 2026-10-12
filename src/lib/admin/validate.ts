import { isValidImo } from "@/lib/utils";
import type { FieldConfig } from "./resources";

export type FieldErrors = Record<string, string>;

const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const DATE = /^\d{4}-\d{2}-\d{2}$/;
const TIME = /^([01]\d|2[0-3]):[0-5]\d(:[0-5]\d)?$/;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const EMAIL = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

function str(v: unknown): string {
  return typeof v === "string" ? v.trim() : v === null || v === undefined ? "" : String(v).trim();
}

/**
 * Converts submitted form values into database values for the given fields,
 * collecting human-readable errors keyed by column name. Mirrors the CHECK
 * constraints in the schema so most mistakes are caught before the round trip.
 */
export function coerceValues(fields: FieldConfig[], input: Record<string, unknown>) {
  const out: Record<string, unknown> = {};
  const errors: FieldErrors = {};

  for (const field of fields) {
    if (field.readOnly) continue;
    const columns = field.bilingual ? [`${field.name}_en`, `${field.name}_bn`] : [field.name];

    for (const column of columns) {
      const isPrimary = !field.bilingual || column.endsWith("_en");
      const raw = input[column];
      const required = !!field.required && isPrimary;
      const fail = (msg: string) => (errors[column] = msg);

      switch (field.type) {
        case "boolean":
          out[column] = raw === true || raw === "true" || raw === "on";
          break;

        case "number":
        case "decimal": {
          const s = str(raw);
          if (!s) {
            if (required) fail("Required");
            out[column] = null;
            break;
          }
          const n = Number(s);
          if (!Number.isFinite(n) || (field.type === "number" && !Number.isInteger(n))) {
            fail(field.type === "number" ? "Enter a whole number" : "Enter a number");
            break;
          }
          if (field.min !== undefined && n < field.min) fail(`Must be at least ${field.min}`);
          else if (field.max !== undefined && n > field.max) fail(`Must be at most ${field.max}`);
          out[column] = n;
          break;
        }

        case "list":
        case "images": {
          const list = Array.isArray(raw) ? raw : str(raw).split("\n");
          const clean = list.map((x) => str(x)).filter(Boolean);
          if (required && !clean.length) fail("Add at least one item");
          out[column] = clean;
          break;
        }

        case "file": {
          const path = str(raw);
          out[column] = path || null;
          if (field.fileColumns) {
            const { name, size, mime } = field.fileColumns;
            out[name] = path ? str(input[name]) || null : null;
            out[size] = path && input[size] ? Number(input[size]) : null;
            out[mime] = path ? str(input[mime]) || null : null;
          }
          if (required && !path) fail("Upload a file");
          break;
        }

        default: {
          const s = str(raw);
          if (!s) {
            if (required) fail("Required");
            out[column] = null;
            break;
          }
          switch (field.type) {
            case "slug":
              if (!SLUG.test(s) || s.length > 120) fail("Use lowercase letters, numbers and single hyphens");
              break;
            case "url":
              if (!/^https?:\/\/\S+$/i.test(s)) fail("Enter a full address starting with https://");
              break;
            case "email":
              if (!EMAIL.test(s)) fail("Enter a valid email address");
              break;
            case "imo":
              if (!isValidImo(s)) fail("Not a valid IMO number (7 digits with a valid check digit)");
              break;
            case "select":
              if (field.options && !field.options.some((o) => o.value === s)) fail("Choose a value from the list");
              break;
            case "relation":
              if (!UUID.test(s)) fail("Choose a value from the list");
              break;
            case "date":
              if (!DATE.test(s) || Number.isNaN(Date.parse(s))) fail("Enter a valid date");
              break;
            case "time":
              if (!TIME.test(s)) fail("Enter a time as HH:MM");
              break;
            case "datetime":
              if (Number.isNaN(Date.parse(s))) fail("Enter a valid date and time");
              break;
          }
          out[column] =
            field.type === "datetime" && !Number.isNaN(Date.parse(s))
              ? new Date(s).toISOString()
              : field.type === "time" && TIME.test(s)
                ? s.length === 5
                  ? `${s}:00`
                  : s
                : s;
        }
      }
    }
  }
  return { values: out, errors };
}

/** Friendly text for common Postgres / PostgREST errors. */
export function describeDbError(error: { code?: string; message: string; details?: string | null }): string {
  switch (error.code) {
    case "23505":
      return "That value is already in use by another record (for example the slug, IMO number or year).";
    case "23514":
      return "One of the values is outside the allowed range. Please check dates, numbers and required links.";
    case "23503":
      return "This record is linked to something that no longer exists.";
    case "42501":
      return "You don't have permission to make this change.";
    case "PGRST116":
      return "The record could not be found, or you don't have access to it.";
    default:
      return error.message || "The change could not be saved.";
  }
}
