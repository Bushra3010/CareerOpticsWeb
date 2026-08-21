import { LEAD_STATUSES, type LeadStatus } from "@/config/leads";
import { createClient } from "@/lib/supabase/server";

/**
 * Admin reads — PRD §5.5.
 *
 * These go through the **cookie-bound** server client, never the service role:
 * RLS is what enforces that only an active profile sees a lead, and using the
 * admin client here would quietly bypass the only check there is.
 */

const LEAD_SELECT = `id, name, phone, email, city, country_code, level, source, status,
  message, page_url, utm_source, utm_medium, utm_campaign, answers, created_at,
  courses(name, short_name), colleges(name, slug)`;

export type LeadFilters = {
  status?: string;
  source?: string;
  q?: string;
  page?: number;
};

export const LEADS_PAGE_SIZE = 25;

export async function listLeads(filters: LeadFilters) {
  const supabase = await createClient();
  const page = Math.max(1, filters.page ?? 1);

  let query = supabase
    .from("leads")
    .select(LEAD_SELECT, { count: "exact" })
    .order("created_at", { ascending: false });

  if (filters.status && LEAD_STATUSES.includes(filters.status as LeadStatus)) {
    query = query.eq("status", filters.status as LeadStatus);
  }
  if (filters.source) query = query.eq("source", filters.source);
  if (filters.q?.trim()) {
    // Counsellors search by whoever just called them: name or number.
    const term = filters.q.trim().replace(/[%,()*\\]/g, " ");
    query = query.or(`name.ilike.*${term}*,phone.ilike.*${term}*`);
  }

  const from = (page - 1) * LEADS_PAGE_SIZE;
  const { data, error, count } = await query.range(
    from,
    from + LEADS_PAGE_SIZE - 1,
  );

  if (error) throw new Error(`leads: ${error.message}`);

  return {
    leads: data ?? [],
    total: count ?? 0,
    page,
    pageCount: Math.max(1, Math.ceil((count ?? 0) / LEADS_PAGE_SIZE)),
  };
}

export type AdminLead = Awaited<ReturnType<typeof listLeads>>["leads"][number];

export async function getLead(id: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("leads")
    .select(LEAD_SELECT)
    .eq("id", id)
    .maybeSingle();

  if (error) throw new Error(`lead ${id}: ${error.message}`);
  return data;
}

/** Notes timeline for one lead (§5.5). */
export async function getLeadActivities(leadId: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("lead_activities")
    .select("id, action, note, created_at, user_id")
    .eq("lead_id", leadId)
    .order("created_at", { ascending: false });

  if (error) throw new Error(`lead_activities: ${error.message}`);
  return data ?? [];
}

/** Distinct sources present in the data, for the filter dropdown. */
export async function getLeadSources() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("leads")
    .select("source")
    .gte("created_at", new Date(Date.now() - 365 * 86400_000).toISOString());
  if (error) throw new Error(`leads: ${error.message}`);
  return [...new Set((data ?? []).map((row) => row.source).filter(Boolean))].sort();
}

/** §5.5 dashboard: leads today/week/month, source split, top colleges. */
export async function getDashboardStats() {
  const supabase = await createClient();

  const now = new Date();
  const startOfToday = new Date(now);
  startOfToday.setHours(0, 0, 0, 0);
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  const countSince = async (since: Date) => {
    const { count, error } = await supabase
      .from("leads")
      .select("id", { count: "exact", head: true })
      .gte("created_at", since.toISOString());
    if (error) throw new Error(`leads count: ${error.message}`);
    return count ?? 0;
  };

  const [today, week, month, recent, statusRows] = await Promise.all([
    countSince(startOfToday),
    countSince(weekAgo),
    countSince(monthAgo),
    // Source split and top colleges over the last 30 days — grouped here
    // because PostgREST has no group-by. Scoped to 30 days to avoid a full
    // table scan once the leads table grows.
    supabase
      .from("leads")
      .select("source, colleges(name, slug)")
      .gte("created_at", monthAgo.toISOString()),
    // Status distribution over the same 30-day window to avoid a full-table
    // scan once leads grows.
    supabase
      .from("leads")
      .select("status")
      .gte("created_at", monthAgo.toISOString()),
  ]);

  if (recent.error) throw new Error(`leads: ${recent.error.message}`);
  if (statusRows.error) throw new Error(`leads status: ${statusRows.error.message}`);

  const bySource = new Map<string, number>();
  const byCollege = new Map<string, { name: string; slug: string; count: number }>();

  for (const row of recent.data ?? []) {
    if (row.source) bySource.set(row.source, (bySource.get(row.source) ?? 0) + 1);
    const college = row.colleges;
    if (college?.slug) {
      const entry = byCollege.get(college.slug) ?? {
        name: college.name,
        slug: college.slug,
        count: 0,
      };
      entry.count += 1;
      byCollege.set(college.slug, entry);
    }
  }

  const byStatus = new Map<string, number>();
  for (const row of statusRows.data ?? []) {
    if (row.status) byStatus.set(row.status, (byStatus.get(row.status) ?? 0) + 1);
  }

  return {
    today,
    week,
    month,
    sources: [...bySource.entries()]
      .map(([source, count]) => ({ source, count }))
      .sort((a, b) => b.count - a.count),
    topColleges: [...byColleges(byCollege)].slice(0, 5),
    statuses: LEAD_STATUSES.map((status) => ({
      status,
      count: byStatus.get(status) ?? 0,
    })),
  };
}

function byColleges(map: Map<string, { name: string; slug: string; count: number }>) {
  return [...map.values()].sort((a, b) => b.count - a.count);
}

/** Reviews awaiting moderation (§5.5). */
export async function listReviews(approved: boolean) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("reviews")
    .select("id, name, email, course, rating, title, body, is_approved, created_at, colleges(name, slug)")
    .eq("is_approved", approved)
    .order("created_at", { ascending: false });

  if (error) throw new Error(`reviews: ${error.message}`);
  return data ?? [];
}

export type AdminReview = Awaited<ReturnType<typeof listReviews>>[number];
