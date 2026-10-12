import type { TableName, Tables } from "@/lib/types";
import { complianceItems, links, siteSettings } from "./content";
import {
  albums,
  auditLog,
  committeeMembers,
  contactMessages,
  documents,
  industryStatistics,
  labourStatistics,
  meetingMinutes,
  members,
  pastPresidents,
  photos,
  posts,
  previewProfiles,
  tideEntries,
  vessels,
  yards,
} from "./data";
import { pages } from "./pages";

/** Every fixture table, keyed exactly like the Supabase tables. */
export const fixtures: { [K in TableName]: Tables[K][] } = {
  yards,
  members,
  profiles: previewProfiles,
  site_settings: [siteSettings],
  pages,
  posts,
  documents,
  meeting_minutes: meetingMinutes,
  committee_members: committeeMembers,
  past_presidents: pastPresidents,
  vessels,
  industry_statistics: industryStatistics,
  labour_statistics: labourStatistics,
  tide_entries: tideEntries,
  compliance_items: complianceItems,
  links,
  albums,
  photos,
  contact_messages: contactMessages,
  audit_log: auditLog,
};
