import type { Database } from "@/types/database.types";

/**
 * Lead status vocabulary — PRD §5.5.
 *
 * Deliberately in `config/`, not in `lib/queries/admin.ts`: the status select
 * is a client component, and importing these from the query module would drag
 * `lib/supabase/server.ts` — and therefore `next/headers` — into the browser
 * bundle. Types and constants that both sides need live here.
 */
export type LeadStatus = Database["public"]["Enums"]["lead_status"];

export const LEAD_STATUSES: LeadStatus[] = [
  "new",
  "contacted",
  "interested",
  "visit_scheduled",
  "admitted",
  "dropped",
  "junk",
];

export const STATUS_LABELS: Record<LeadStatus, string> = {
  new: "New",
  contacted: "Contacted",
  interested: "Interested",
  visit_scheduled: "Visit scheduled",
  admitted: "Admitted",
  dropped: "Dropped",
  junk: "Junk",
};
