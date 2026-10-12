import { getIndustryStatistics } from "@/lib/data/public";
import { csvResponse, toCsv } from "@/lib/csv";

/** Year-wise industry statistics as CSV. */
export async function GET() {
  const rows = await getIndustryStatistics();
  const csv = toCsv(
    ["Year", "Vessels recycled", "Vessels beached", "Total LDT", "Active yards", "Green yards", "Steel output (t)", "Workers employed", "Global share (%)", "Notes", "Source"],
    rows.map((r) => [
      r.year,
      r.vessels_recycled,
      r.vessels_beached,
      r.total_ldt,
      r.active_yards,
      r.green_yards,
      r.steel_output_tonnes,
      r.workers_employed,
      r.global_share_percent,
      r.notes_en,
      r.source,
    ]),
  );
  return csvResponse("bsbra-industry-statistics.csv", csv);
}
