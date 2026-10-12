import type { NextRequest } from "next/server";
import { getTideBounds, getTideEntries } from "@/lib/data/public";
import { csvResponse, toCsv } from "@/lib/csv";

/** Tide table export: ?month=YYYY-MM, or ?year=YYYY / ?year=all. */
export async function GET(request: NextRequest) {
  const sp = request.nextUrl.searchParams;
  const month = sp.get("month");
  const year = sp.get("year");
  let from: string;
  let to: string;
  let label: string;

  if (month && /^\d{4}-\d{2}$/.test(month)) {
    const [y, m] = month.split("-").map(Number);
    from = `${month}-01`;
    to = `${month}-${String(new Date(Date.UTC(y, m, 0)).getUTCDate()).padStart(2, "0")}`;
    label = month;
  } else if (year && /^\d{4}$/.test(year)) {
    from = `${year}-01-01`;
    to = `${year}-12-31`;
    label = year;
  } else {
    const bounds = await getTideBounds();
    if (!bounds.first || !bounds.last) return csvResponse("bsbra-tides.csv", toCsv(["Station", "Date", "Time", "Type", "Height (m)"], []));
    from = bounds.first;
    to = bounds.last;
    label = "all";
  }

  // Fetch month by month to stay within the per-query row limit.
  const rows = [];
  let cursor = new Date(`${from.slice(0, 7)}-01T00:00:00Z`);
  const end = new Date(`${to}T00:00:00Z`);
  while (cursor <= end) {
    const y = cursor.getUTCFullYear();
    const m = cursor.getUTCMonth();
    const start = `${y}-${String(m + 1).padStart(2, "0")}-01`;
    const last = `${y}-${String(m + 1).padStart(2, "0")}-${String(new Date(Date.UTC(y, m + 1, 0)).getUTCDate()).padStart(2, "0")}`;
    rows.push(...(await getTideEntries(start < from ? from : start, last > to ? to : last)));
    cursor = new Date(Date.UTC(y, m + 1, 1));
  }

  const csv = toCsv(
    ["Station", "Date", "Time (BST)", "Type", "Height (m)"],
    rows.map((r) => [r.station, r.tide_date, r.tide_time.slice(0, 5), r.tide_type, r.height_m]),
  );
  return csvResponse(`bsbra-tides-${label}.csv`, csv);
}
