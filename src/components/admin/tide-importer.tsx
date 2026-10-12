"use client";

import { useMemo, useRef, useState, useTransition } from "react";
import { toast } from "sonner";
import { CheckCircle2, CircleAlert, FileUp } from "lucide-react";
import { parseCsv } from "@/lib/csv";
import { importTides } from "@/lib/admin/actions";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/field";
import { Switch } from "./switch";

interface ParsedRow {
  station: string;
  tide_date: string;
  tide_time: string;
  tide_type: "high" | "low";
  height_m: number;
}

const SAMPLE = `station,date,time,type,height_m
Sitakunda Coast,2027-01-01,03:24,high,4.6
Sitakunda Coast,2027-01-01,09:30,low,0.4`;

/** Parses and validates a tide CSV in the browser, previews it, then imports in batches. */
export function TideImporter({ canReplace }: { canReplace: boolean }) {
  const [text, setText] = useState("");
  const [replace, setReplace] = useState(false);
  const [pending, startTransition] = useTransition();
  const file = useRef<HTMLInputElement>(null);

  const { rows, errors } = useMemo(() => {
    const out: ParsedRow[] = [];
    const errs: string[] = [];
    if (!text.trim()) return { rows: out, errors: errs };
    const table = parseCsv(text);
    const header = table[0]?.map((h) => h.trim().toLowerCase()) ?? [];
    const idx = (names: string[]) => header.findIndex((h) => names.includes(h));
    const cols = {
      station: idx(["station"]),
      date: idx(["date", "tide_date"]),
      time: idx(["time", "tide_time"]),
      type: idx(["type", "tide_type"]),
      height: idx(["height", "height_m", "height (m)"]),
    };
    if (cols.date < 0 || cols.time < 0 || cols.type < 0 || cols.height < 0) {
      return { rows: out, errors: ["The first row must contain the columns: date, time, type, height_m (station is optional)."] };
    }
    table.slice(1).forEach((r, i) => {
      const line = i + 2;
      const date = r[cols.date]?.trim() ?? "";
      const time = r[cols.time]?.trim() ?? "";
      const type = (r[cols.type]?.trim().toLowerCase() ?? "") as "high" | "low";
      const height = Number(r[cols.height]);
      if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return errs.push(`Line ${line}: date must be YYYY-MM-DD`);
      if (!/^([01]\d|2[0-3]):[0-5]\d(:[0-5]\d)?$/.test(time)) return errs.push(`Line ${line}: time must be HH:MM`);
      if (type !== "high" && type !== "low") return errs.push(`Line ${line}: type must be high or low`);
      if (!Number.isFinite(height) || height < -5 || height > 15) return errs.push(`Line ${line}: height must be a number between -5 and 15`);
      out.push({ station: (cols.station >= 0 && r[cols.station]?.trim()) || "Sitakunda Coast", tide_date: date, tide_time: time, tide_type: type, height_m: height });
    });
    return { rows: out, errors: errs };
  }, [text]);

  const run = () =>
    startTransition(async () => {
      const result = await importTides(rows, replace);
      if (result.ok) {
        toast.success(`${result.imported} tide entries imported`);
        setText("");
      } else toast.error(result.error ?? "Import failed.");
    });

  const range = rows.length ? `${rows.map((r) => r.tide_date).sort()[0]} → ${rows.map((r) => r.tide_date).sort().at(-1)}` : "";

  return (
    <div className="grid gap-6 lg:grid-cols-[1.3fr_1fr]">
      <section className="rounded-[var(--radius-card)] bg-surface p-6 hairline">
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 className="text-[1.0625rem] font-semibold">CSV data</h2>
          <button type="button" onClick={() => file.current?.click()} className="press inline-flex h-9 items-center gap-2 rounded-full bg-bg-muted px-4 text-[0.8125rem] font-medium">
            <FileUp className="size-4" /> Choose file
          </button>
          <input
            ref={file}
            type="file"
            accept=".csv,text/csv"
            className="sr-only"
            onChange={async (e) => {
              const f = e.target.files?.[0];
              if (f) setText(await f.text());
              e.target.value = "";
            }}
          />
        </div>
        <Textarea value={text} onChange={(e) => setText(e.target.value)} placeholder={SAMPLE} rows={14} className="font-mono text-[0.8125rem]" />
        <p className="mt-2 text-[0.8125rem] text-fg-subtle">Columns: station (optional), date (YYYY-MM-DD), time (HH:MM, Bangladesh time), type (high/low), height_m.</p>
      </section>

      <section className="space-y-4">
        <div className="rounded-[var(--radius-card)] bg-surface p-6 hairline">
          <h2 className="mb-3 text-[1.0625rem] font-semibold">Check</h2>
          {!text.trim() ? (
            <p className="text-[0.875rem] text-fg-subtle">Paste CSV data or choose a file to preview it here.</p>
          ) : (
            <>
              <p className="flex items-center gap-2 text-[0.9375rem]">
                {errors.length ? <CircleAlert className="size-5 text-danger" /> : <CheckCircle2 className="size-5 text-ok" />}
                <span>
                  <strong>{rows.length}</strong> valid rows{errors.length ? `, ${errors.length} with problems` : ""}
                </span>
              </p>
              {range && <p className="mt-1 text-[0.8125rem] text-fg-subtle tabular">{range}</p>}
              {errors.length > 0 && (
                <ul className="mt-3 max-h-40 space-y-1 overflow-y-auto text-[0.8125rem] text-danger">
                  {errors.slice(0, 50).map((e) => (
                    <li key={e}>{e}</li>
                  ))}
                </ul>
              )}
            </>
          )}
        </div>
        <div className="rounded-[var(--radius-card)] bg-surface p-6 hairline">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-[0.9375rem] font-medium">Replace existing entries in this date range</p>
              <p className="text-[0.8125rem] text-fg-subtle">{canReplace ? "Removes old entries for the same station before importing." : "Only editors can replace existing data."}</p>
            </div>
            <Switch label="Replace existing" checked={replace} onChange={setReplace} disabled={!canReplace} />
          </div>
          <Button className="mt-5 w-full" disabled={pending || rows.length === 0 || errors.length > 0} onClick={run}>
            {pending ? "Importing…" : `Import ${rows.length || ""} entries`}
          </Button>
        </div>
      </section>
    </div>
  );
}
