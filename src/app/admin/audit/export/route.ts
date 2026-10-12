import { NextResponse, type NextRequest } from "next/server";
import { getViewer } from "@/lib/auth/session";
import { isAdmin } from "@/lib/auth/permissions";
import { isPreviewMode } from "@/lib/env";
import { listAudit } from "@/lib/admin/queries";
import { createServerSupabase } from "@/lib/supabase/server";
import { csvResponse, toCsv } from "@/lib/csv";

/** Audit report download for administrators (up to 10,000 entries, current filters). */
export async function GET(request: NextRequest) {
  const viewer = await getViewer();
  if (!viewer || !isAdmin(viewer.role)) return new NextResponse("Forbidden", { status: 403 });
  const sp = request.nextUrl.searchParams;
  const date = (v: string | null) => (v && /^\d{4}-\d{2}-\d{2}$/.test(v) ? v : undefined);

  const rows = [];
  for (let page = 1; page <= 10; page++) {
    const batch = await listAudit({
      table: sp.get("table") || undefined,
      action: sp.get("action") || undefined,
      actor: sp.get("actor") || undefined,
      from: date(sp.get("from")),
      to: date(sp.get("to")),
      page,
      pageSize: 1000,
    });
    rows.push(...batch.rows);
    if (batch.rows.length < 1000) break;
  }

  if (!isPreviewMode) {
    const supabase = await createServerSupabase();
    await supabase.rpc("log_activity", { p_action: "export", p_target: "audit_log", p_details: { rows: rows.length } });
  }

  const csv = toCsv(
    ["Time (UTC)", "User", "Role", "Action", "Section", "Record ID", "Record", "Changed fields", "Before", "After"],
    rows.map((e) => [
      e.occurred_at,
      e.actor_email,
      e.actor_role,
      e.action,
      e.table_name,
      e.record_id,
      e.record_label,
      e.changed_fields?.join("; "),
      e.old_data ? JSON.stringify(e.changed_fields?.length ? Object.fromEntries(e.changed_fields.map((f) => [f, e.old_data?.[f]])) : e.old_data) : "",
      e.new_data ? JSON.stringify(e.changed_fields?.length ? Object.fromEntries(e.changed_fields.map((f) => [f, e.new_data?.[f]])) : e.new_data) : "",
    ]),
  );
  const stamp = new Date().toISOString().slice(0, 10);
  return csvResponse(`bsbra-audit-${stamp}.csv`, csv);
}
