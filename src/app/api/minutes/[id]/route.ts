import { NextResponse, type NextRequest } from "next/server";
import { isPreviewMode } from "@/lib/env";
import { viewerReader } from "@/lib/data/readers";
import { createServerSupabase } from "@/lib/supabase/server";

/** Minutes download — access is decided by RLS on meeting_minutes and the minutes bucket. */
export async function GET(request: NextRequest, { params }: RouteContext<"/api/minutes/[id]">) {
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) return new NextResponse("Not found", { status: 404 });

  const reader = await viewerReader();
  const minutes = await reader.first("meeting_minutes", [{ col: "id", op: "eq", value: id }]);
  if (!minutes?.file_path) {
    return NextResponse.redirect(new URL(`/en/login?next=${encodeURIComponent("/en/portal/minutes")}`, request.url));
  }

  if (isPreviewMode) return NextResponse.redirect(new URL("/samples/bsbra-sample.pdf", request.url));

  const supabase = await createServerSupabase();
  const { data, error } = await supabase.storage
    .from("minutes")
    .createSignedUrl(minutes.file_path, 60, { download: minutes.file_name ?? true });
  if (error || !data) return new NextResponse("File unavailable", { status: 404 });

  await supabase.rpc("log_activity", { p_action: "download", p_target: `meeting_minutes:${minutes.id}` });
  return NextResponse.redirect(data.signedUrl);
}
