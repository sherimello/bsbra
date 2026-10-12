import { NextResponse, type NextRequest } from "next/server";
import { isPreviewMode } from "@/lib/env";
import { viewerReader } from "@/lib/data/readers";
import { createServerSupabase } from "@/lib/supabase/server";

/**
 * Document download. The record is read with the visitor's own session, so
 * Row Level Security decides access; private files are served through a
 * short-lived signed URL that storage policies also check.
 */
export async function GET(request: NextRequest, { params }: RouteContext<"/api/documents/[id]">) {
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) return new NextResponse("Not found", { status: 404 });

  const reader = await viewerReader();
  const doc = await reader.first("documents", [{ col: "id", op: "eq", value: id }]);
  if (!doc) {
    // Hidden or missing: send signed-out visitors to sign in.
    return NextResponse.redirect(new URL(`/en/login?next=${encodeURIComponent("/en/portal/documents")}`, request.url));
  }

  if (!doc.file_path) {
    return doc.external_url ? NextResponse.redirect(doc.external_url) : new NextResponse("Not found", { status: 404 });
  }

  if (isPreviewMode) return NextResponse.redirect(new URL("/samples/bsbra-sample.pdf", request.url));

  const supabase = await createServerSupabase();
  const { data, error } = await supabase.storage
    .from("documents")
    .createSignedUrl(doc.file_path, 60, { download: doc.file_name ?? true });
  if (error || !data) return new NextResponse("File unavailable", { status: 404 });

  await supabase.rpc("record_document_download", { p_document_id: doc.id });
  return NextResponse.redirect(data.signedUrl);
}
