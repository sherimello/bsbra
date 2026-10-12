import type { NextRequest } from "next/server";
import { getVesselsForExport, getYards } from "@/lib/data/public";
import { csvResponse, toCsv } from "@/lib/csv";
import type { VesselStatus, VesselType } from "@/lib/types";

/** Public vessel database export, honouring the same filters as /vessels. */
export async function GET(request: NextRequest) {
  const sp = request.nextUrl.searchParams;
  const year = /^\d{4}$/.test(sp.get("year") ?? "") ? Number(sp.get("year")) : null;
  const [rows, yards] = await Promise.all([
    getVesselsForExport({
      q: sp.get("q") ?? undefined,
      yard: sp.get("yard") || null,
      type: (sp.get("type") as VesselType) || null,
      status: (sp.get("status") as VesselStatus) || null,
      year,
    }),
    getYards(),
  ]);
  const yardName = new Map(yards.map((y) => [y.id, y.name_en]));
  const csv = toCsv(
    ["Vessel", "Former names", "IMO", "Flag", "Type", "LDT", "GT", "DWT", "Year built", "Yard", "Arrival", "Beaching", "Cutting started", "Cutting completed", "Status", "Recycling year"],
    rows.map((v) => [
      v.vessel_name,
      v.former_names,
      v.imo_number,
      v.flag,
      v.vessel_type,
      v.ldt,
      v.gross_tonnage,
      v.dwt,
      v.year_built,
      v.yard_id ? yardName.get(v.yard_id) : "",
      v.arrival_date,
      v.beaching_date,
      v.cutting_started_on,
      v.cutting_completed_on,
      v.status,
      v.recycling_year,
    ]),
  );
  return csvResponse(`bsbra-vessels${year ? `-${year}` : ""}.csv`, csv);
}
