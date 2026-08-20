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

// ── Phase 2: appointments ────────────────────────────────────────────────────

export async function listAppointments(filters: { date?: string; status?: string } = {}) {
  const supabase = await createCrmClient();
  let query = supabase
    .from("appointments")
    .select(`
      id, lead_id, appointment_type, meet_link, host_id, created_by,
      scheduled_date, scheduled_time, duration_minutes, status, notes,
      review_note, created_at,
      lead:leads(id, full_name, phone)
    `)
    .order("scheduled_date", { ascending: true })
    .order("scheduled_time", { ascending: true });

  if (filters.date) query = query.eq("scheduled_date", filters.date);
  if (filters.status) query = query.eq("status", filters.status);

  const { data, error } = await query.limit(200);
  if (error) throw new Error(`crm.appointments: ${error.message}`);
  return data ?? [];
}

export type CrmAppointment = Awaited<ReturnType<typeof listAppointments>>[number];

/** Slots already taken for a host on a date, so the picker can grey them out. */
export async function bookedSlots(hostId: string, date: string) {
  const supabase = await createCrmClient();
  const { data, error } = await supabase
    .from("appointments")
    .select("scheduled_time")
    .eq("host_id", hostId)
    .eq("scheduled_date", date)
    .neq("status", "cancelled");
  if (error) throw new Error(`crm.appointments: ${error.message}`);
  return new Set((data ?? []).map((r) => String(r.scheduled_time).slice(0, 5)));
}

// ── Phase 2: associates ──────────────────────────────────────────────────────

export async function listAssociates(filters: { q?: string; status?: string } = {}) {
  const supabase = await createCrmClient();
  let query = supabase
    .from("associates")
    .select(`
      id, name, phone, email, associate_code, status, wallet_balance,
      city, district, state, institution_name, coordinator_name,
      user_id, rejection_reason, created_at, approved_at
    `)
    .order("created_at", { ascending: false });

  if (filters.status) query = query.eq("status", filters.status);
  if (filters.q?.trim()) {
    const q = filters.q.trim();
    query = query.or(
      `name.ilike.%${q}%,phone.ilike.%${q}%,email.ilike.%${q}%,associate_code.ilike.%${q}%`,
    );
  }

  const { data, error } = await query.limit(300);
  if (error) throw new Error(`crm.associates: ${error.message}`);
  return data ?? [];
}

export type CrmAssociate = Awaited<ReturnType<typeof listAssociates>>[number];

export async function getAssociate(id: string) {
  const supabase = await createCrmClient();
  const { data, error } = await supabase
    .from("associates")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error) throw new Error(`crm.associates: ${error.message}`);
  return data;
}

export async function getAssociateDetail(id: string) {
  const supabase = await createCrmClient();
  const [wallet, dispatches, tickets, recharges] = await Promise.all([
    supabase.from("associate_wallet_txns").select("*").eq("associate_id", id)
      .order("created_at", { ascending: false }).limit(100),
    supabase.from("associate_dispatches").select("*").eq("associate_id", id)
      .order("created_at", { ascending: false }).limit(50),
    supabase.from("associate_support_tickets").select("*").eq("associate_id", id)
      .order("created_at", { ascending: false }).limit(50),
    supabase.from("wallet_recharge_requests").select("*").eq("associate_id", id)
      .order("created_at", { ascending: false }).limit(50),
  ]);
  return {
    wallet: wallet.data ?? [],
    dispatches: dispatches.data ?? [],
    tickets: tickets.data ?? [],
    recharges: recharges.data ?? [],
  };
}

export async function listAssociateResources() {
  const supabase = await createCrmClient();
  const { data, error } = await supabase
    .from("associate_resources")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw new Error(`crm.associate_resources: ${error.message}`);
  return data ?? [];
}

export async function listRechargeRequests(status?: string) {
  const supabase = await createCrmClient();
  let query = supabase
    .from("wallet_recharge_requests")
    .select("*, associate:associates(id, name, phone, associate_code)")
    .order("created_at", { ascending: false });
  if (status) query = query.eq("status", status);
  const { data, error } = await query.limit(200);
  if (error) throw new Error(`crm.wallet_recharge_requests: ${error.message}`);
  return data ?? [];
}

export async function listSupportTickets(
  table: "associate_support_tickets" | "student_support_tickets",
  status?: string,
) {
  const supabase = await createCrmClient();
  const rel = table === "associate_support_tickets"
    ? "associate:associates(id, name, phone)"
    : "student:students(id, full_name, enrollment_number)";
  let query = supabase.from(table).select(`*, ${rel}`)
    .order("created_at", { ascending: false });
  if (status) query = query.eq("status", status);
  const { data, error } = await query.limit(200);
  if (error) throw new Error(`crm.${table}: ${error.message}`);
  return data ?? [];
}

// ── Phase 2: dispatch ────────────────────────────────────────────────────────

export async function listDispatches(
  filters: { q?: string; status?: string; direction?: string } = {},
) {
  const supabase = await createCrmClient();
  let query = supabase
    .from("student_dispatches")
    .select("*, associate:associates(id, name)")
    .order("created_at", { ascending: false });

  if (filters.status) query = query.eq("status", filters.status);
  if (filters.direction) query = query.eq("dispatch_type", filters.direction);
  if (filters.q?.trim()) {
    const q = filters.q.trim();
    query = query.or(
      `student_name.ilike.%${q}%,enrollment_number.ilike.%${q}%,tracking_number.ilike.%${q}%`,
    );
  }

  const { data, error } = await query.limit(300);
  if (error) throw new Error(`crm.student_dispatches: ${error.message}`);
  return data ?? [];
}

export type CrmDispatch = Awaited<ReturnType<typeof listDispatches>>[number];

// ── Phase 2: student documents, exams, portal ────────────────────────────────

export async function getStudentDocuments(studentId: string) {
  const supabase = await createCrmClient();
  const { data, error } = await supabase
    .from("student_documents")
    .select("*")
    .eq("student_id", studentId)
    .order("created_at", { ascending: true });
  if (error) throw new Error(`crm.student_documents: ${error.message}`);
  return data ?? [];
}

export async function getStudentExams(studentId: string) {
  const supabase = await createCrmClient();
  const { data, error } = await supabase
    .from("student_exams")
    .select("*")
    .eq("student_id", studentId)
    .order("exam_date", { ascending: false });
  if (error) throw new Error(`crm.student_exams: ${error.message}`);
  return data ?? [];
}

export async function listStudyMaterials() {
  const supabase = await createCrmClient();
  const { data, error } = await supabase
    .from("study_materials")
    .select("*, course:courses(id, name)")
    .order("created_at", { ascending: false });
  if (error) throw new Error(`crm.study_materials: ${error.message}`);
  return data ?? [];
}

export async function listAnnouncements() {
  const supabase = await createCrmClient();
  const { data, error } = await supabase
    .from("student_announcements")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(100);
  if (error) throw new Error(`crm.student_announcements: ${error.message}`);
  return data ?? [];
}

// ── Phase 2: HRMS ────────────────────────────────────────────────────────────

export async function listEmployees(includeInactive = false) {
  const supabase = await createCrmClient();
  let query = supabase
    .from("employees")
    .select(`
      id, profile_id, employee_code, department, designation, joining_date,
      basic_salary, hra, allowances, incentive, pf_deduction, tds_deduction,
      other_deductions, bank_account, bank_ifsc, bank_name, is_active, created_at
    `)
    .order("employee_code", { ascending: true });
  if (!includeInactive) query = query.eq("is_active", true);

  const { data, error } = await query;
  if (error) throw new Error(`crm.employees: ${error.message}`);

  // `employees.profile_id` points at public.profiles, which the crm-schema
  // client cannot join across — PostgREST embeds only within one schema. Two
  // queries and a map, rather than denormalising a name that would go stale.
  const rows = data ?? [];
  if (rows.length === 0) return [];

  const publicDb = await createClient();
  const { data: profiles } = await publicDb
    .from("profiles")
    .select("id, full_name, role, phone")
    .in("id", rows.map((r) => r.profile_id));

  const byId = new Map((profiles ?? []).map((p) => [p.id, p]));
  return rows.map((r) => ({ ...r, profile: byId.get(r.profile_id) ?? null }));
}

export type CrmEmployee = Awaited<ReturnType<typeof listEmployees>>[number];

export async function getEmployee(id: string) {
  const supabase = await createCrmClient();
  const { data, error } = await supabase
    .from("employees").select("*").eq("id", id).maybeSingle();
  if (error) throw new Error(`crm.employees: ${error.message}`);
  if (!data) return null;

  const publicDb = await createClient();
  const { data: profile } = await publicDb
    .from("profiles")
    .select("id, full_name, role, phone")
    .eq("id", data.profile_id)
    .maybeSingle();

  return { ...data, profile: profile ?? null };
}

export async function getAttendance(date: string) {
  const supabase = await createCrmClient();
  const { data, error } = await supabase
    .from("attendance").select("*").eq("date", date);
  if (error) throw new Error(`crm.attendance: ${error.message}`);
  return new Map((data ?? []).map((r) => [r.employee_id as string, r]));
}

export async function getEmployeeAttendance(employeeId: string, from: string, to: string) {
  const supabase = await createCrmClient();
  const { data, error } = await supabase
    .from("attendance").select("*")
    .eq("employee_id", employeeId)
    .gte("date", from).lte("date", to)
    .order("date", { ascending: false });
  if (error) throw new Error(`crm.attendance: ${error.message}`);
  return data ?? [];
}

export async function listLeaveRequests(status?: string) {
  const supabase = await createCrmClient();
  let query = supabase
    .from("leave_requests")
    .select("*, employee:employees(id, employee_code, designation)")
    .order("created_at", { ascending: false });
  if (status) query = query.eq("status", status);
  const { data, error } = await query.limit(200);
  if (error) throw new Error(`crm.leave_requests: ${error.message}`);
  return data ?? [];
}

export async function listPayroll(month: number, year: number) {
  const supabase = await createCrmClient();
  const { data, error } = await supabase
    .from("payroll")
    .select("*, employee:employees(id, employee_code, designation, department)")
    .eq("month", month)
    .eq("year", year)
    .order("created_at", { ascending: true });
  if (error) throw new Error(`crm.payroll: ${error.message}`);
  return data ?? [];
}

export async function listAdvances(status?: string) {
  const supabase = await createCrmClient();
  let query = supabase
    .from("advance_salaries")
    .select("*, employee:employees(id, employee_code, designation)")
    .order("given_on", { ascending: false });
  if (status) query = query.eq("status", status);
  const { data, error } = await query.limit(200);
  if (error) throw new Error(`crm.advance_salaries: ${error.message}`);
  return data ?? [];
}

export async function listExpenses(
  filters: { status?: string; category?: string; from?: string; to?: string } = {},
) {
  const supabase = await createCrmClient();
  let query = supabase.from("expenses").select("*")
    .order("expense_date", { ascending: false });
  if (filters.status) query = query.eq("status", filters.status);
  if (filters.category) query = query.eq("category", filters.category);
  if (filters.from) query = query.gte("expense_date", filters.from);
  if (filters.to) query = query.lte("expense_date", filters.to);
  const { data, error } = await query.limit(300);
  if (error) throw new Error(`crm.expenses: ${error.message}`);
  return data ?? [];
}

export type CrmExpense = Awaited<ReturnType<typeof listExpenses>>[number];

// ── Phase 2: litigation, mentorship, targets ─────────────────────────────────

export async function listLitigations(departmentId?: string) {
  const supabase = await createCrmClient();
  let query = supabase
    .from("department_litigations")
    .select("*, department:departments(id, name), session:sessions(id, name)")
    .order("created_at", { ascending: false });
  if (departmentId) query = query.eq("department_id", departmentId);
  const { data, error } = await query.limit(300);
  if (error) throw new Error(`crm.department_litigations: ${error.message}`);
  return data ?? [];
}

export async function listMentorships(status?: string) {
  const supabase = await createCrmClient();
  let query = supabase
    .from("student_mentorships")
    .select("*, student:students(id, full_name, enrollment_number)")
    .order("created_at", { ascending: false });
  if (status) query = query.eq("status", status);
  const { data, error } = await query.limit(200);
  if (error) throw new Error(`crm.student_mentorships: ${error.message}`);
  return data ?? [];
}

export async function listTargets(status = "active") {
  const supabase = await createCrmClient();
  const { data, error } = await supabase
    .from("revenue_targets").select("*")
    .eq("status", status)
    .order("start_date", { ascending: false });
  if (error) throw new Error(`crm.revenue_targets: ${error.message}`);
  return data ?? [];
}

/**
 * Targets with actuals attached.
 *
 * Progress is measured from payments recorded inside the window, not from
 * students.amount_paid — a running total says nothing about *when* the money
 * arrived, and a target is a statement about a period.
 */
export async function listTargetsWithProgress(status = "active") {
  const supabase = await createCrmClient();
  const targets = await listTargets(status);
  if (targets.length === 0) return [];

  const earliest = targets.reduce(
    (min, t) => (t.start_date < min ? t.start_date : min),
    targets[0].start_date as string,
  );

  const [{ data: payments }, { data: leads }] = await Promise.all([
    supabase.from("payments").select("amount, payment_date, recorded_by")
      .gte("payment_date", earliest),
    supabase.from("leads").select("assigned_to, status, created_at, converted_at")
      .gte("created_at", `${earliest}T00:00:00Z`),
  ]);

  return targets.map((t) => {
    const inWindow = (d: string | null) =>
      !!d && d >= t.start_date && d <= t.end_date;

    const revenue = (payments ?? [])
      .filter((p) => p.recorded_by === t.assignee_id && inWindow(p.payment_date))
      .reduce((sum, p) => sum + Number(p.amount ?? 0), 0);

    const mine = (leads ?? []).filter((l) => l.assigned_to === t.assignee_id);
    const leadCount = mine.filter((l) => inWindow((l.created_at ?? "").slice(0, 10))).length;
    const conversions = mine.filter(
      (l) => l.status === "converted" && inWindow((l.converted_at ?? "").slice(0, 10)),
    ).length;

    return { ...t, actual: { revenue, leads: leadCount, conversions } };
  });
}

export async function listNotifications(limit = 100) {
  const supabase = await createCrmClient();
  const { data, error } = await supabase
    .from("notifications").select("*")
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw new Error(`crm.notifications: ${error.message}`);
  return data ?? [];
}

// ── Phase 2: settings reference data ─────────────────────────────────────────

export async function getSettingsData() {
  const supabase = await createCrmClient();
  const [departments, subSections, sessions, courses, subCourses, fields] =
    await Promise.all([
      supabase.from("departments").select("*").order("name"),
      supabase.from("department_sub_sections").select("*").order("name"),
      supabase.from("sessions").select("*").order("name", { ascending: false }),
      supabase.from("courses").select("*").order("name"),
      supabase.from("sub_courses").select("*").order("name"),
      supabase.from("lead_form_fields").select("*").order("display_order"),
    ]);

  return {
    departments: departments.data ?? [],
    subSections: subSections.data ?? [],
    sessions: sessions.data ?? [],
    courses: courses.data ?? [],
    subCourses: subCourses.data ?? [],
    fields: fields.data ?? [],
  };
}

export type CrmSettingsData = Awaited<ReturnType<typeof getSettingsData>>;

/** Staff who can be assigned work or hosted against — from public.profiles. */
export async function listStaff() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("id, full_name, role, phone")
    .eq("is_active", true)
    .order("full_name");
  if (error) throw new Error(`profiles: ${error.message}`);
  // Portal accounts are not staff and must never appear in an assignee list.
  return (data ?? []).filter((p) => p.role !== "associate" && p.role !== "student");
}
