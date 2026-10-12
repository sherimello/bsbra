import "server-only";
import type { DocumentRecord, MeetingMinutes, Member, Yard } from "@/lib/types";
import { viewerReader } from "./readers";

/**
 * Session-aware queries for the members' and corporate portal. They run as
 * the signed-in user, so Row Level Security returns only what their role may
 * see. Request-time only — call inside a <Suspense> boundary.
 */

export async function getPortalDocuments(limit = 100): Promise<DocumentRecord[]> {
  const reader = await viewerReader();
  const { rows } = await reader.list({
    table: "documents",
    filters: [
      { col: "access_level", op: "in", value: ["corporate", "members", "internal"] },
      { col: "status", op: "eq", value: "published" },
    ],
    order: [{ col: "published_on", ascending: false }, { col: "title_en" }],
    limit,
  });
  return rows;
}

export async function getMinutes(): Promise<MeetingMinutes[]> {
  const reader = await viewerReader();
  const { rows } = await reader.list({
    table: "meeting_minutes",
    filters: [{ col: "status", op: "eq", value: "approved" }],
    order: [{ col: "meeting_date", ascending: false }],
    limit: 200,
  });
  return rows;
}

export async function getMemberDirectory(): Promise<{ members: Member[]; yards: Pick<Yard, "id" | "name_en" | "name_bn" | "slug">[] }> {
  const reader = await viewerReader();
  const [members, yards] = await Promise.all([
    reader.list({ table: "members", order: [{ col: "company_name" }], limit: 1000 }),
    reader.list({ table: "yards", columns: "id, name_en, name_bn, slug", limit: 1000 }),
  ]);
  return { members: members.rows, yards: yards.rows };
}
