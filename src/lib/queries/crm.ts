import {
  CRM_LEADS_PAGE_SIZE,
  CRM_LEAD_SOURCES,
  CRM_LEAD_STATUSES,
  CRM_OPEN_STATUSES,
  type CrmLeadSource,
  type CrmLeadStatus,
} from "@/config/crm";
import { createCrmClient } from "@/lib/supabase/crm";
import { createClient } from "@/lib/supabase/server";

/**
 * CRM reads. Everything goes through the cookie-bound `crm` client so RLS
 * decides what the signed-in user sees — a telecaller gets their own leads, a
 * manager gets all of them, and neither is enforced here.
 */

const LEAD_SELECT = `
  id, full_name, phone, email, city, state, status, custom_status, source, mode,
  assigned_to, assigned_at, next_followup_date, total_fee, amount_paid,
  enrollment_date, converted_at, metadata, website_lead_id, created_at,
  course:courses(id, name),
  sub_course:sub_courses(id, name),
  session:sessions(id, name),
  department:departments(id, name)
`;

export type CrmLeadFilters = {
  q?: string;
  status?: string;
  source?: string;
  assigned?: string;
  course?: string;
  session?: string;
  city?: string;
  payment?: string;
  from?: string;
  to?: string;
  /** "open" (default) hides converted and lost; "all" shows everything. */
  view?: string;
  page?: number;
};

export async function listCrmLeads(filters: CrmLeadFilters) {
  const supabase = await createCrmClient();
  const page = Math.max(1, filters.page ?? 1);

  let query = supabase
    .from("leads")
    .select(LEAD_SELECT, { count: "exact" })
    .order("created_at", { ascending: false });

  if (filters.status && CRM_LEAD_STATUSES.includes(filters.status as CrmLeadStatus)) {
    query = query.eq("status", filters.status);
  } else if (filters.view !== "all") {
    // The inbox is for leads still worth a call; closed ones need "All".
    query = query.in("status", CRM_OPEN_STATUSES);
  }

  if (filters.source && CRM_LEAD_SOURCES.includes(filters.source as CrmLeadSource)) {
    query = query.eq("source", filters.source);
  }
  if (filters.assigned === "unassigned") query = query.is("assigned_to", null);
  else if (filters.assigned) query = query.eq("assigned_to", filters.assigned);

  if (filters.course) query = query.eq("course_id", filters.course);
  if (filters.session) query = query.eq("session_id", filters.session);
  if (filters.city) query = query.ilike("city", `%${sanitise(filters.city)}%`);
  if (filters.from) query = query.gte("created_at", filters.from);
  if (filters.to) query = query.lte("created_at", `${filters.to}T23:59:59`);

  if (filters.q?.trim()) {
    const term = sanitise(filters.q);
    query = query.or(
      `full_name.ilike.*${term}*,phone.ilike.*${term}*,email.ilike.*${term}*`,
    );
  }

  // Payment state is a comparison between two columns, which PostgREST cannot
  // express, so it is applied to the page after fetching.
  const from = (page - 1) * CRM_LEADS_PAGE_SIZE;
  const { data, error, count } = await query.range(
    from,
    from + CRM_LEADS_PAGE_SIZE - 1,
  );
  if (error) throw new Error(`crm.leads: ${error.message}`);

  let leads = (data ?? []) as unknown as CrmLead[];
  if (filters.payment) leads = leads.filter((lead) => paymentState(lead) === filters.payment);

  return {
    leads,
    total: count ?? leads.length,
    page,
    pageCount: Math.max(1, Math.ceil((count ?? 0) / CRM_LEADS_PAGE_SIZE)),
  };
}

export type CrmLead = {
  id: string;
  full_name: string;
  phone: string;
  email: string | null;
  city: string | null;
  state: string | null;
  status: CrmLeadStatus;
  custom_status: string | null;
  source: CrmLeadSource;
  mode: string | null;
  assigned_to: string | null;
  assigned_at: string | null;
  next_followup_date: string | null;
  total_fee: number | null;
  amount_paid: number;
  enrollment_date: string | null;
  converted_at: string | null;
  metadata: Record<string, unknown> | null;
  website_lead_id: string | null;
  created_at: string;
  course: { id: string; name: string } | null;
  sub_course: { id: string; name: string } | null;
  session: { id: string; name: string } | null;
  department: { id: string; name: string } | null;
};

export function paymentState(lead: Pick<CrmLead, "total_fee" | "amount_paid">) {
  const paid = Number(lead.amount_paid ?? 0);
  const total = Number(lead.total_fee ?? 0);
  if (paid <= 0) return "unpaid";
  if (total > 0 && paid >= total) return "paid";
  return "partial";
}

/** PostgREST treats these as syntax inside an `or=` filter. */
function sanitise(value: string) {
  return value.trim().replace(/[%,()*\\]/g, " ");
}

export async function getCrmLead(id: string) {
  const supabase = await createCrmClient();
  const { data, error } = await supabase
    .from("leads")
    .select(LEAD_SELECT)
    .eq("id", id)
    .maybeSingle();

  if (error) throw new Error(`crm lead ${id}: ${error.message}`);
  return data as unknown as CrmLead | null;
}

export async function getCrmLeadActivities(leadId: string) {
  const supabase = await createCrmClient();
  const { data, error } = await supabase
    .from("lead_activities")
    .select("id, activity_type, old_value, new_value, note, performed_by, created_at")
    .eq("lead_id", leadId)
    .order("created_at", { ascending: false });

  if (error) throw new Error(`crm.lead_activities: ${error.message}`);
  return (data ?? []) as CrmActivity[];
}

export type CrmActivity = {
  id: string;
  activity_type: string;
  old_value: string | null;
  new_value: string | null;
  note: string | null;
  performed_by: string | null;
  created_at: string;
};

/** Dropdown options for the filter bar and the lead form. */
export async function getCrmOptions() {
  const crm = await createCrmClient();
  const site = await createClient();

  const [courses, subCourses, sessions, departments, subSections, staff] =
    await Promise.all([
      crm.from("courses").select("id, name").eq("is_active", true).order("name"),
      crm.from("sub_courses").select("id, name, course_id").eq("is_active", true).order("name"),
      crm.from("sessions").select("id, name").eq("is_active", true).order("name"),
      crm.from("departments").select("id, name").eq("is_active", true).order("name"),
      crm.from("department_sub_sections").select("id, name, department_id").eq("is_active", true).order("name"),
      // Staff live in public.profiles — the CRM shares one user table (0005).
      site.from("profiles").select("id, full_name, role").eq("is_active", true).order("full_name"),
    ]);

  return {
    courses: courses.data ?? [],
    subCourses: subCourses.data ?? [],
    sessions: sessions.data ?? [],
    departments: departments.data ?? [],
    subSections: subSections.data ?? [],
    staff: (staff.data ?? []).map((p) => ({
      id: p.id,
      name: p.full_name ?? "Unnamed",
      role: p.role,
    })),
  };
}

export type CrmOptions = Awaited<ReturnType<typeof getCrmOptions>>;

/** Counts for the pipeline strip above the list. */
export async function getCrmLeadCounts() {
  const supabase = await createCrmClient();
  const { data, error } = await supabase.from("leads").select("status");
  if (error) throw new Error(`crm.leads: ${error.message}`);

  const counts = new Map<string, number>();
  for (const row of data ?? []) {
    counts.set(row.status, (counts.get(row.status) ?? 0) + 1);
  }
  return {
    total: (data ?? []).length,
    byStatus: counts,
    open: CRM_OPEN_STATUSES.reduce((sum, s) => sum + (counts.get(s) ?? 0), 0),
  };
}

/** Leads whose follow-up date has arrived or passed — the day's call list. */
export async function getDueFollowUps(limit = 20) {
  const supabase = await createCrmClient();
  const today = new Date().toISOString().slice(0, 10);

  const { data, error } = await supabase
    .from("leads")
    .select("id, full_name, phone, status, next_followup_date, assigned_to")
    .not("next_followup_date", "is", null)
    .lte("next_followup_date", today)
    .in("status", CRM_OPEN_STATUSES)
    .order("next_followup_date", { ascending: true })
    .limit(limit);

  if (error) throw new Error(`crm.leads: ${error.message}`);
  return data ?? [];
}

// ── Students ─────────────────────────────────────────────────────────────────

const STUDENT_SELECT = `
  id, enrollment_number, full_name, phone, email, city, father_name,
  guardian_name, guardian_phone, mode, status, drop_reason,
  total_fee, amount_paid, enrollment_date, assigned_counsellor, lead_id,
  created_at,
  course:courses(id, name),
  sub_course:sub_courses(id, name),
  session:sessions(id, name),
  department:departments(id, name)
`;

export type CrmStudentFilters = {
  q?: string;
  status?: string;
  course?: string;
  session?: string;
  page?: number;
};

export async function listCrmStudents(filters: CrmStudentFilters) {
  const supabase = await createCrmClient();
  const page = Math.max(1, filters.page ?? 1);

  let query = supabase
    .from("students")
    .select(STUDENT_SELECT, { count: "exact" })
    .order("created_at", { ascending: false });

  if (filters.status) query = query.eq("status", filters.status);
  if (filters.course) query = query.eq("course_id", filters.course);
  if (filters.session) query = query.eq("session_id", filters.session);
  if (filters.q?.trim()) {
    const term = sanitise(filters.q);
    query = query.or(
      `full_name.ilike.*${term}*,phone.ilike.*${term}*,enrollment_number.ilike.*${term}*`,
    );
  }

  const from = (page - 1) * CRM_LEADS_PAGE_SIZE;
  const { data, error, count } = await query.range(from, from + CRM_LEADS_PAGE_SIZE - 1);
  if (error) throw new Error(`crm.students: ${error.message}`);

  return {
    students: (data ?? []) as unknown as CrmStudent[],
    total: count ?? 0,
    page,
    pageCount: Math.max(1, Math.ceil((count ?? 0) / CRM_LEADS_PAGE_SIZE)),
  };
}

export type CrmStudent = {
  id: string;
  enrollment_number: string;
  full_name: string;
  phone: string;
  email: string | null;
  city: string | null;
  father_name: string | null;
  guardian_name: string | null;
  guardian_phone: string | null;
  mode: string | null;
  status: string;
  drop_reason: string | null;
  total_fee: number | null;
  amount_paid: number;
  enrollment_date: string | null;
  assigned_counsellor: string | null;
  lead_id: string | null;
  created_at: string;
  course: { id: string; name: string } | null;
  sub_course: { id: string; name: string } | null;
  session: { id: string; name: string } | null;
  department: { id: string; name: string } | null;
};

export async function getCrmStudent(id: string) {
  const supabase = await createCrmClient();
  const { data, error } = await supabase
    .from("students")
    .select(STUDENT_SELECT)
    .eq("id", id)
    .maybeSingle();
  if (error) throw new Error(`crm student ${id}: ${error.message}`);
  return data as unknown as CrmStudent | null;
}

export async function getStudentPayments(studentId: string) {
  const supabase = await createCrmClient();
  const { data, error } = await supabase
    .from("payments")
    .select("id, amount, payment_mode, payment_date, receipt_number, notes, created_at")
    .eq("student_id", studentId)
    .order("payment_date", { ascending: false });
  if (error) throw new Error(`crm.payments: ${error.message}`);
  return data ?? [];
}

/** Money in, and what is still outstanding across active students. */
export async function getCrmMoneyStats() {
  const supabase = await createCrmClient();

  const [payments, students] = await Promise.all([
    supabase.from("payments").select("amount, payment_date"),
    supabase.from("students").select("total_fee, amount_paid, status"),
  ]);

  const rows = payments.data ?? [];
  const monthAgo = new Date(Date.now() - 30 * 86400_000).toISOString().slice(0, 10);

  const collected = rows.reduce((sum, p) => sum + Number(p.amount ?? 0), 0);
  const collected30 = rows
    .filter((p) => (p.payment_date ?? "") >= monthAgo)
    .reduce((sum, p) => sum + Number(p.amount ?? 0), 0);

  const outstanding = (students.data ?? [])
    .filter((s) => s.status !== "dropped")
    .reduce((sum, s) => sum + Math.max(0, Number(s.total_fee ?? 0) - Number(s.amount_paid ?? 0)), 0);

  return { collected, collected30, outstanding, payments: rows.length };
}

/**
 * Aggregates for `/admin/crm/analytics`.
 *
 * Counted in JS over narrow selects rather than with SQL aggregates: PostgREST
 * cannot GROUP BY without an RPC, and an RPC needs a migration we cannot apply
 * to the live project yet — the same constraint documented for search in P9.
 * The row counts here are the CRM's own leads/students, not the public
 * catalogue, so this stays cheap for a long time.
 */
export async function getCrmAnalytics() {
  const supabase = await createCrmClient();

  const [leads, students, payments] = await Promise.all([
    supabase.from("leads").select("status, source, created_at"),
    supabase.from("students").select("status"),
    supabase.from("payments").select("amount, payment_mode, payment_date"),
  ]);

  if (leads.error) throw new Error(`crm.leads: ${leads.error.message}`);
  if (students.error) throw new Error(`crm.students: ${students.error.message}`);
  if (payments.error) throw new Error(`crm.payments: ${payments.error.message}`);

  const leadRows = leads.data ?? [];
  const studentRows = students.data ?? [];
  const paymentRows = payments.data ?? [];

  const tally = <T,>(rows: T[], key: (row: T) => string | null) => {
    const map = new Map<string, number>();
    for (const row of rows) {
      const k = key(row);
      if (k) map.set(k, (map.get(k) ?? 0) + 1);
    }
    return [...map.entries()].sort((a, b) => b[1] - a[1]);
  };

  const monthAgo = new Date(Date.now() - 30 * 86400_000).toISOString();
  const recent = leadRows.filter((l) => (l.created_at ?? "") >= monthAgo);
  const convertedRecent = recent.filter((l) => l.status === "converted").length;

  const revenueByMode = new Map<string, number>();
  for (const p of paymentRows) {
    const mode = p.payment_mode ?? "other";
    revenueByMode.set(mode, (revenueByMode.get(mode) ?? 0) + Number(p.amount ?? 0));
  }

  return {
    totalLeads: leadRows.length,
    totalStudents: studentRows.length,
    revenue: paymentRows.reduce((sum, p) => sum + Number(p.amount ?? 0), 0),
    // Over the last 30 days only. A lifetime rate flatters itself as the
    // catalogue ages and stops being a signal anyone can act on.
    conversionRate: recent.length > 0 ? (convertedRecent / recent.length) * 100 : 0,
    recentLeads: recent.length,
    leadsBySource: tally(leadRows, (l) => l.source),
    leadsByStatus: tally(leadRows, (l) => l.status),
    studentsByStatus: tally(studentRows, (s) => s.status),
    revenueByMode: [...revenueByMode.entries()].sort((a, b) => b[1] - a[1]),
  };
}
