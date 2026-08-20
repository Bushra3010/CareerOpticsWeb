"use server";

import { revalidatePath } from "next/cache";

import { z } from "zod";

import {
  APPOINTMENT_STATUSES,
  APPROVAL_STATUSES,
  ASSOCIATE_STATUSES,
  ATTENDANCE_STATUSES,
  DISPATCH_STATUSES,
  EXPENSE_CATEGORIES,
  LEAVE_TYPES,
  NOTIFICATION_TYPES,
  PAYROLL_STATUSES,
  STUDENT_DOC_STATUSES,
  STUDENT_DOC_TYPES,
  TARGET_PERIODS,
  TICKET_STATUSES,
} from "@/config/crm";
import { can, isCrmManager, requireStaff } from "@/lib/auth";
import { createCrmClient } from "@/lib/supabase/crm";

/**
 * Phase-2 CRM mutations — appointments, associates, dispatch, HRMS, finance,
 * litigation, mentorship, targets and settings.
 *
 * Split from `actions.ts` (leads and students) purely for size. Same rules:
 * Server Actions run with the caller's JWT so RLS, not `requireStaff`, is the
 * boundary. Every write that a manager alone may perform re-checks with
 * `{ count: "exact" }` and reports a refusal rather than silently doing
 * nothing — an RLS denial on UPDATE is not an error, it matches zero rows.
 */
export type CrmResult = { ok: boolean; error?: string };

const uuid = z.uuid();
const blank = (v: string | undefined | null) => (v && v !== "" ? v : null);
const num = (v: unknown) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
};

async function guard(area: "leads" | "content" | "admin" = "leads") {
  const staff = await requireStaff();
  if (!can(staff.role, area)) return { error: "Your account cannot do that." as const };
  return { staff };
}

/** Manager-only work — HRMS, finance, approvals. */
async function guardManager() {
  const staff = await requireStaff();
  if (!isCrmManager(staff.role)) {
    return { error: "Only a manager can do that." as const };
  }
  return { staff };
}

function fail(error: unknown, fallback: string): CrmResult {
  const message = error instanceof Error ? error.message : String(error ?? "");
  return { ok: false, error: message || fallback };
}

// ── Appointments ─────────────────────────────────────────────────────────────

const appointmentInput = z.object({
  lead_id: uuid,
  appointment_type: z.enum(["office_visit", "google_meet"]),
  meet_link: z.string().trim().max(500).optional(),
  host_id: uuid,
  scheduled_date: z.iso.date(),
  scheduled_time: z.string().regex(/^\d{2}:\d{2}$/, "Pick a slot"),
  notes: z.string().trim().max(1000).optional(),
});

export async function createAppointment(formData: FormData): Promise<CrmResult> {
  const g = await guard();
  if ("error" in g) return { ok: false, error: g.error };

  const parsed = appointmentInput.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Check the fields." };
  }
  const d = parsed.data;

  if (d.appointment_type === "google_meet" && !d.meet_link?.trim()) {
    return { ok: false, error: "A Google Meet appointment needs a link." };
  }

  const supabase = await createCrmClient();
  const { error } = await supabase.from("appointments").insert({
    lead_id: d.lead_id,
    appointment_type: d.appointment_type,
    meet_link: blank(d.meet_link),
    host_id: d.host_id,
    created_by: g.staff.id,
    scheduled_date: d.scheduled_date,
    scheduled_time: d.scheduled_time,
    notes: blank(d.notes),
  });

  if (error) {
    // The partial unique index is the real double-booking guard; a
    // check-then-insert has a gap two simultaneous bookers both slip through.
    if (error.code === "23505") {
      return { ok: false, error: "That slot was just taken. Pick another." };
    }
    return fail(error, "Could not book the appointment.");
  }

  await supabase.from("lead_activities").insert({
    lead_id: d.lead_id,
    activity_type: "note_added",
    note: `Appointment ${d.scheduled_date} ${d.scheduled_time} (${d.appointment_type.replace("_", " ")})`,
    performed_by: g.staff.id,
  });

  revalidatePath("/crm/appointments");
  revalidatePath(`/crm/leads/${d.lead_id}`);
  return { ok: true };
}

export async function setAppointmentStatus(formData: FormData): Promise<CrmResult> {
  const g = await guard();
  if ("error" in g) return { ok: false, error: g.error };

  const parsed = z.object({
    id: uuid,
    status: z.enum(APPOINTMENT_STATUSES),
    review_note: z.string().trim().max(1000).optional(),
  }).safeParse({
    id: formData.get("id"),
    status: formData.get("status"),
    review_note: formData.get("review_note") ?? undefined,
  });
  if (!parsed.success) return { ok: false, error: "Invalid status." };

  const supabase = await createCrmClient();
  const { error, count } = await supabase
    .from("appointments")
    .update(
      { status: parsed.data.status, review_note: blank(parsed.data.review_note) },
      { count: "exact" },
    )
    .eq("id", parsed.data.id);

  if (error) return fail(error, "Could not update the appointment.");
  if (!count) return { ok: false, error: "You can only change your own appointments." };

  revalidatePath("/crm/appointments");
  return { ok: true };
}

// ── Associates ───────────────────────────────────────────────────────────────

const associateInput = z.object({
  name: z.string().trim().min(2).max(120),
  phone: z.string().trim().min(6).max(20),
  email: z.email(),
  father_phone: z.string().trim().max(20).optional(),
  associate_code: z.string().trim().max(40).optional(),
  city: z.string().trim().max(80).optional(),
  district: z.string().trim().max(80).optional(),
  state: z.string().trim().max(80).optional(),
  institution_name: z.string().trim().max(160).optional(),
  institution_address: z.string().trim().max(300).optional(),
  aadhar_number: z.string().trim().max(20).optional(),
  pan_number: z.string().trim().max(20).optional(),
  bank_name: z.string().trim().max(120).optional(),
  account_number: z.string().trim().max(40).optional(),
  ifsc_code: z.string().trim().max(20).optional(),
  account_holder_name: z.string().trim().max(120).optional(),
});

export async function createAssociate(formData: FormData): Promise<CrmResult & { id?: string }> {
  const g = await guardManager();
  if ("error" in g) return { ok: false, error: g.error };

  const parsed = associateInput.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Check the fields." };
  }
  const d = parsed.data;

  const supabase = await createCrmClient();
  const { data, error } = await supabase
    .from("associates")
    .insert({
      name: d.name,
      phone: d.phone,
      email: d.email,
      father_phone: blank(d.father_phone),
      associate_code: blank(d.associate_code),
      city: blank(d.city),
      district: blank(d.district),
      state: blank(d.state),
      institution_name: blank(d.institution_name),
      institution_address: blank(d.institution_address),
      aadhar_number: blank(d.aadhar_number),
      pan_number: blank(d.pan_number),
      bank_name: blank(d.bank_name),
      account_number: blank(d.account_number),
      ifsc_code: blank(d.ifsc_code),
      account_holder_name: blank(d.account_holder_name),
      status: "pending",
    })
    .select("id")
    .single();

  if (error) {
    if (error.code === "23505") {
      return { ok: false, error: "That email or associate code is already registered." };
    }
    return fail(error, "Could not create the associate.");
  }

  revalidatePath("/crm/associates");
  return { ok: true, id: data.id };
}

export async function setAssociateStatus(formData: FormData): Promise<CrmResult> {
  const g = await guardManager();
  if ("error" in g) return { ok: false, error: g.error };

  const parsed = z.object({
    id: uuid,
    status: z.enum(ASSOCIATE_STATUSES),
    rejection_reason: z.string().trim().max(300).optional(),
  }).safeParse({
    id: formData.get("id"),
    status: formData.get("status"),
    rejection_reason: formData.get("rejection_reason") ?? undefined,
  });
  if (!parsed.success) return { ok: false, error: "Invalid status." };

  if (parsed.data.status === "rejected" && !parsed.data.rejection_reason?.trim()) {
    return { ok: false, error: "Give a reason for rejecting." };
  }

  const supabase = await createCrmClient();
  const { error, count } = await supabase
    .from("associates")
    .update(
      {
        status: parsed.data.status,
        rejection_reason:
          parsed.data.status === "rejected" ? parsed.data.rejection_reason : null,
        approved_at: parsed.data.status === "approved" ? new Date().toISOString() : null,
        approved_by: parsed.data.status === "approved" ? g.staff.id : null,
      },
      { count: "exact" },
    )
    .eq("id", parsed.data.id);

  if (error) return fail(error, "Could not update the associate.");
  if (!count) return { ok: false, error: "Only a manager can approve an associate." };

  revalidatePath("/crm/associates");
  revalidatePath(`/crm/associates/${parsed.data.id}`);
  return { ok: true };
}

/**
 * Move an associate's wallet.
 *
 * The balance is recomputed from the ledger, never incremented — two managers
 * crediting at the same moment would both read the same balance and one write
 * would be lost. Same reasoning as `recordPayment` in actions.ts.
 */
export async function recordWalletTxn(formData: FormData): Promise<CrmResult> {
  const g = await guardManager();
  if ("error" in g) return { ok: false, error: g.error };

  const parsed = z.object({
    associate_id: uuid,
    type: z.enum(["credit", "debit"]),
    amount: z.coerce.number().positive("Amount must be more than zero"),
    reason: z.string().trim().max(300).optional(),
  }).safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Check the fields." };
  }
  const d = parsed.data;

  const supabase = await createCrmClient();
  const { error } = await supabase.from("associate_wallet_txns").insert({
    associate_id: d.associate_id,
    type: d.type,
    amount: d.amount,
    reason: blank(d.reason),
  });
  if (error) return fail(error, "Could not record the transaction.");

  const { data: ledger } = await supabase
    .from("associate_wallet_txns")
    .select("type, amount")
    .eq("associate_id", d.associate_id);

  if (ledger) {
    const balance = ledger.reduce(
      (sum, t) => sum + (t.type === "credit" ? Number(t.amount) : -Number(t.amount)),
      0,
    );
    await supabase
      .from("associates")
      .update({ wallet_balance: balance })
      .eq("id", d.associate_id);
  }

  revalidatePath(`/crm/associates/${d.associate_id}`);
  return { ok: true };
}

export async function decideRecharge(formData: FormData): Promise<CrmResult> {
  const g = await guardManager();
  if ("error" in g) return { ok: false, error: g.error };

  const parsed = z.object({
    id: uuid,
    status: z.enum(["approved", "rejected"]),
    rejection_reason: z.string().trim().max(300).optional(),
  }).safeParse({
    id: formData.get("id"),
    status: formData.get("status"),
    rejection_reason: formData.get("rejection_reason") ?? undefined,
  });
  if (!parsed.success) return { ok: false, error: "Invalid decision." };

  const supabase = await createCrmClient();
  const { data: request } = await supabase
    .from("wallet_recharge_requests")
    .select("associate_id, amount, status")
    .eq("id", parsed.data.id)
    .maybeSingle();

  if (!request) return { ok: false, error: "That request no longer exists." };
  if (request.status !== "pending") {
    return { ok: false, error: "That request has already been decided." };
  }

  const { error, count } = await supabase
    .from("wallet_recharge_requests")
    .update(
      {
        status: parsed.data.status,
        rejection_reason:
          parsed.data.status === "rejected" ? blank(parsed.data.rejection_reason) : null,
        approved_by: g.staff.id,
        approved_at: new Date().toISOString(),
      },
      { count: "exact" },
    )
    .eq("id", parsed.data.id)
    // Only flip a still-pending row, so two managers clicking at once cannot
    // both credit the wallet.
    .eq("status", "pending");

  if (error) return fail(error, "Could not record the decision.");
  if (!count) return { ok: false, error: "That request was just decided by someone else." };

  if (parsed.data.status === "approved") {
    const credit = new FormData();
    credit.set("associate_id", String(request.associate_id));
    credit.set("type", "credit");
    credit.set("amount", String(request.amount));
    credit.set("reason", "Wallet recharge approved");
    await recordWalletTxn(credit);
  }

  revalidatePath("/crm/associates");
  return { ok: true };
}

export async function saveResource(formData: FormData): Promise<CrmResult> {
  const g = await guardManager();
  if ("error" in g) return { ok: false, error: g.error };

  const parsed = z.object({
    title: z.string().trim().min(2).max(160),
    description: z.string().trim().max(500).optional(),
    type: z.string().trim().min(1),
    url: z.url("Give a valid URL"),
  }).safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Check the fields." };
  }

  const supabase = await createCrmClient();
  const { error } = await supabase.from("associate_resources").insert({
    title: parsed.data.title,
    description: blank(parsed.data.description),
    type: parsed.data.type,
    url: parsed.data.url,
    uploaded_by: g.staff.id,
  });
  if (error) return fail(error, "Could not save the resource.");

  revalidatePath("/crm/associates");
  return { ok: true };
}

export async function replyToTicket(formData: FormData): Promise<CrmResult> {
  const g = await guardManager();
  if ("error" in g) return { ok: false, error: g.error };

  const parsed = z.object({
    id: uuid,
    table: z.enum(["associate_support_tickets", "student_support_tickets"]),
    status: z.enum(TICKET_STATUSES),
    admin_reply: z.string().trim().max(2000).optional(),
  }).safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) return { ok: false, error: "Check the fields." };

  const supabase = await createCrmClient();
  const { error } = await supabase
    .from(parsed.data.table)
    .update({
      status: parsed.data.status,
      admin_reply: blank(parsed.data.admin_reply),
      replied_by: g.staff.id,
      replied_at: new Date().toISOString(),
    })
    .eq("id", parsed.data.id);

  if (error) return fail(error, "Could not reply.");
  revalidatePath("/crm/associates");
  revalidatePath("/crm/support");
  return { ok: true };
}

// ── Dispatch ─────────────────────────────────────────────────────────────────

const dispatchInput = z.object({
  student_name: z.string().trim().min(2).max(120),
  enrollment_number: z.string().trim().max(60).optional(),
  student_phone: z.string().trim().max(20).optional(),
  father_name: z.string().trim().max(120).optional(),
  document_type: z.string().trim().min(1).max(60),
  dispatch_type: z.enum(["inbound", "outbound"]),
  courier: z.string().trim().max(80).optional(),
  tracking_number: z.string().trim().max(80).optional(),
  dispatch_date: z.union([z.iso.date(), z.literal("")]).optional(),
  expected_delivery: z.union([z.iso.date(), z.literal("")]).optional(),
  remarks: z.string().trim().max(500).optional(),
});

export async function createDispatch(formData: FormData): Promise<CrmResult> {
  const g = await guard();
  if ("error" in g) return { ok: false, error: g.error };

  const parsed = dispatchInput.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Check the fields." };
  }
  const d = parsed.data;

  const supabase = await createCrmClient();
  const { error } = await supabase.from("student_dispatches").insert({
    student_name: d.student_name,
    enrollment_number: blank(d.enrollment_number),
    student_phone: blank(d.student_phone),
    father_name: blank(d.father_name),
    document_type: d.document_type,
    dispatch_type: d.dispatch_type,
    courier: blank(d.courier),
    tracking_number: blank(d.tracking_number),
    dispatch_date: blank(d.dispatch_date),
    expected_delivery: blank(d.expected_delivery),
    remarks: blank(d.remarks),
    dispatched_by: g.staff.id,
  });

  if (error) return fail(error, "Could not create the dispatch.");
  revalidatePath("/crm/dispatch");
  return { ok: true };
}

export async function setDispatchStatus(formData: FormData): Promise<CrmResult> {
  const g = await guard();
  if ("error" in g) return { ok: false, error: g.error };

  const parsed = z.object({
    id: uuid,
    status: z.enum(DISPATCH_STATUSES),
    tracking_number: z.string().trim().max(80).optional(),
  }).safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) return { ok: false, error: "Invalid status." };

  const supabase = await createCrmClient();
  const patch: Record<string, unknown> = { status: parsed.data.status };
  if (parsed.data.tracking_number) patch.tracking_number = parsed.data.tracking_number;
  // Stamp the send date the first time it actually leaves, so the tracking
  // list can age rows without a second field to keep in step.
  if (parsed.data.status === "dispatched") {
    patch.dispatch_date = new Date().toISOString().slice(0, 10);
  }

  const { error } = await supabase
    .from("student_dispatches").update(patch).eq("id", parsed.data.id);
  if (error) return fail(error, "Could not update the dispatch.");

  revalidatePath("/crm/dispatch");
  return { ok: true };
}

// ── Student documents and exams ──────────────────────────────────────────────

export async function saveStudentDocument(formData: FormData): Promise<CrmResult> {
  const g = await guard();
  if ("error" in g) return { ok: false, error: g.error };

  const parsed = z.object({
    student_id: uuid,
    doc_type: z.enum(STUDENT_DOC_TYPES),
    status: z.enum(STUDENT_DOC_STATUSES),
    file_url: z.string().trim().max(500).optional(),
    notes: z.string().trim().max(500).optional(),
  }).safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) return { ok: false, error: "Check the fields." };
  const d = parsed.data;

  const supabase = await createCrmClient();
  const { error } = await supabase
    .from("student_documents")
    .upsert(
      {
        student_id: d.student_id,
        doc_type: d.doc_type,
        status: d.status,
        file_url: blank(d.file_url),
        notes: blank(d.notes),
        uploaded_by: g.staff.id,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "student_id,doc_type" },
    );

  if (error) return fail(error, "Could not save the document.");
  revalidatePath(`/crm/students/${d.student_id}`);
  return { ok: true };
}

export async function saveStudentExam(formData: FormData): Promise<CrmResult> {
  const g = await guard();
  if ("error" in g) return { ok: false, error: g.error };

  const parsed = z.object({
    student_id: uuid,
    exam_type: z.string().trim().min(1),
    exam_name: z.string().trim().min(1).max(160),
    exam_date: z.union([z.iso.date(), z.literal("")]).optional(),
    centre: z.string().trim().max(160).optional(),
    hall_ticket_number: z.string().trim().max(80).optional(),
    score: z.string().trim().max(40).optional(),
    remarks: z.string().trim().max(500).optional(),
  }).safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) return { ok: false, error: "Check the fields." };
  const d = parsed.data;

  const supabase = await createCrmClient();
  const { error } = await supabase.from("student_exams").insert({
    student_id: d.student_id,
    exam_type: d.exam_type,
    exam_name: d.exam_name,
    exam_date: blank(d.exam_date),
    centre: blank(d.centre),
    hall_ticket_number: blank(d.hall_ticket_number),
    score: blank(d.score),
    remarks: blank(d.remarks),
  });

  if (error) return fail(error, "Could not save the exam.");
  revalidatePath(`/crm/students/${d.student_id}`);
  return { ok: true };
}

// ── HRMS ─────────────────────────────────────────────────────────────────────

const employeeInput = z.object({
  profile_id: uuid,
  employee_code: z.string().trim().min(2).max(40),
  department: z.string().trim().max(80).optional(),
  designation: z.string().trim().max(80).optional(),
  joining_date: z.union([z.iso.date(), z.literal("")]).optional(),
  basic_salary: z.coerce.number().min(0).optional(),
  hra: z.coerce.number().min(0).optional(),
  allowances: z.coerce.number().min(0).optional(),
  incentive: z.coerce.number().min(0).optional(),
  pf_deduction: z.coerce.number().min(0).optional(),
  tds_deduction: z.coerce.number().min(0).optional(),
  other_deductions: z.coerce.number().min(0).optional(),
  bank_account: z.string().trim().max(40).optional(),
  bank_ifsc: z.string().trim().max(20).optional(),
  bank_name: z.string().trim().max(120).optional(),
});

export async function saveEmployee(formData: FormData): Promise<CrmResult> {
  const g = await guardManager();
  if ("error" in g) return { ok: false, error: g.error };

  const id = formData.get("id");
  const parsed = employeeInput.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Check the fields." };
  }
  const d = parsed.data;

  const row = {
    profile_id: d.profile_id,
    employee_code: d.employee_code,
    department: blank(d.department),
    designation: blank(d.designation),
    joining_date: blank(d.joining_date),
    basic_salary: num(d.basic_salary) ?? 0,
    hra: num(d.hra) ?? 0,
    allowances: num(d.allowances) ?? 0,
    incentive: num(d.incentive) ?? 0,
    pf_deduction: num(d.pf_deduction) ?? 0,
    tds_deduction: num(d.tds_deduction) ?? 0,
    other_deductions: num(d.other_deductions) ?? 0,
    bank_account: blank(d.bank_account),
    bank_ifsc: blank(d.bank_ifsc),
    bank_name: blank(d.bank_name),
    updated_at: new Date().toISOString(),
  };

  const supabase = await createCrmClient();
  const { error } = typeof id === "string" && id
    ? await supabase.from("employees").update(row).eq("id", id)
    : await supabase.from("employees").insert(row);

  if (error) {
    if (error.code === "23505") {
      return { ok: false, error: "That staff member or employee code already exists." };
    }
    return fail(error, "Could not save the employee.");
  }

  revalidatePath("/crm/hrms");
  return { ok: true };
}

export async function markAttendance(formData: FormData): Promise<CrmResult> {
  const g = await guardManager();
  if ("error" in g) return { ok: false, error: g.error };

  const parsed = z.object({
    employee_id: uuid,
    date: z.iso.date(),
    status: z.enum(ATTENDANCE_STATUSES),
    clock_in: z.string().trim().max(8).optional(),
    clock_out: z.string().trim().max(8).optional(),
    notes: z.string().trim().max(300).optional(),
  }).safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) return { ok: false, error: "Check the fields." };
  const d = parsed.data;

  const supabase = await createCrmClient();
  const { error } = await supabase.from("attendance").upsert(
    {
      employee_id: d.employee_id,
      date: d.date,
      status: d.status,
      clock_in: blank(d.clock_in),
      clock_out: blank(d.clock_out),
      notes: blank(d.notes),
      marked_by: g.staff.id,
    },
    { onConflict: "employee_id,date" },
  );

  if (error) return fail(error, "Could not mark attendance.");
  revalidatePath("/crm/hrms/attendance");
  return { ok: true };
}

export async function requestLeave(formData: FormData): Promise<CrmResult> {
  const g = await guard();
  if ("error" in g) return { ok: false, error: g.error };

  const parsed = z.object({
    employee_id: uuid,
    leave_type: z.enum(LEAVE_TYPES),
    from_date: z.iso.date(),
    to_date: z.iso.date(),
    reason: z.string().trim().max(500).optional(),
  }).safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) return { ok: false, error: "Check the fields." };
  const d = parsed.data;

  if (d.to_date < d.from_date) {
    return { ok: false, error: "The end date cannot be before the start date." };
  }

  const supabase = await createCrmClient();
  const { error } = await supabase.from("leave_requests").insert({
    employee_id: d.employee_id,
    leave_type: d.leave_type,
    from_date: d.from_date,
    to_date: d.to_date,
    reason: blank(d.reason),
  });

  if (error) return fail(error, "Could not submit the request.");
  revalidatePath("/crm/hrms/leaves");
  return { ok: true };
}

export async function decideLeave(formData: FormData): Promise<CrmResult> {
  const g = await guardManager();
  if ("error" in g) return { ok: false, error: g.error };

  const parsed = z.object({
    id: uuid,
    status: z.enum(APPROVAL_STATUSES),
  }).safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) return { ok: false, error: "Invalid decision." };

  const supabase = await createCrmClient();
  const { error, count } = await supabase
    .from("leave_requests")
    .update({ status: parsed.data.status, approved_by: g.staff.id }, { count: "exact" })
    .eq("id", parsed.data.id);

  if (error) return fail(error, "Could not record the decision.");
  if (!count) return { ok: false, error: "Only a manager can decide a leave request." };

  revalidatePath("/crm/hrms/leaves");
  return { ok: true };
}

/**
 * Build a month's payslip for one employee.
 *
 * Gross and net are computed here from the employee's own salary components
 * rather than trusting numbers posted from the browser — a payslip is the one
 * place where a tampered form field turns straight into money.
 */
export async function generatePayslip(formData: FormData): Promise<CrmResult> {
  const g = await guardManager();
  if ("error" in g) return { ok: false, error: g.error };

  const parsed = z.object({
    employee_id: uuid,
    month: z.coerce.number().int().min(1).max(12),
    year: z.coerce.number().int().min(2000).max(2100),
    advance_deduction: z.coerce.number().min(0).optional(),
  }).safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) return { ok: false, error: "Check the fields." };
  const d = parsed.data;

  const supabase = await createCrmClient();
  const { data: employee } = await supabase
    .from("employees")
    .select("basic_salary, hra, allowances, incentive, pf_deduction, tds_deduction, other_deductions")
    .eq("id", d.employee_id)
    .maybeSingle();

  if (!employee) return { ok: false, error: "That employee no longer exists." };

  const basic = Number(employee.basic_salary ?? 0);
  const hra = Number(employee.hra ?? 0);
  const allowances = Number(employee.allowances ?? 0);
  const incentive = Number(employee.incentive ?? 0);
  const pf = Number(employee.pf_deduction ?? 0);
  const tds = Number(employee.tds_deduction ?? 0);
  const other = Number(employee.other_deductions ?? 0);
  const advance = num(d.advance_deduction) ?? 0;

  const gross = basic + hra + allowances + incentive;
  const net = Math.max(0, gross - pf - tds - other - advance);

  const { error } = await supabase.from("payroll").upsert(
    {
      employee_id: d.employee_id,
      month: d.month,
      year: d.year,
      basic, hra, allowances, incentive, gross,
      pf, tds, other_deductions: other,
      advance_deduction: advance,
      net,
      status: "draft",
    },
    { onConflict: "employee_id,month,year" },
  );

  if (error) return fail(error, "Could not generate the payslip.");
  revalidatePath("/crm/hrms/payroll");
  return { ok: true };
}

export async function setPayrollStatus(formData: FormData): Promise<CrmResult> {
  const g = await guardManager();
  if ("error" in g) return { ok: false, error: g.error };

  const parsed = z.object({
    id: uuid,
    status: z.enum(PAYROLL_STATUSES),
  }).safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) return { ok: false, error: "Invalid status." };

  const supabase = await createCrmClient();
  const { error, count } = await supabase
    .from("payroll")
    .update(
      {
        status: parsed.data.status,
        payment_date:
          parsed.data.status === "paid" ? new Date().toISOString().slice(0, 10) : null,
      },
      { count: "exact" },
    )
    .eq("id", parsed.data.id);

  if (error) return fail(error, "Could not update the payslip.");
  if (!count) return { ok: false, error: "Only a manager can change payroll." };

  revalidatePath("/crm/hrms/payroll");
  return { ok: true };
}

export async function recordAdvance(formData: FormData): Promise<CrmResult> {
  const g = await guardManager();
  if ("error" in g) return { ok: false, error: g.error };

  const parsed = z.object({
    employee_id: uuid,
    amount: z.coerce.number().positive("Amount must be more than zero"),
    given_on: z.iso.date(),
    reason: z.string().trim().max(300).optional(),
  }).safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Check the fields." };
  }

  const supabase = await createCrmClient();
  const { error } = await supabase.from("advance_salaries").insert({
    employee_id: parsed.data.employee_id,
    amount: parsed.data.amount,
    given_on: parsed.data.given_on,
    reason: blank(parsed.data.reason),
    created_by: g.staff.id,
  });

  if (error) return fail(error, "Could not record the advance.");
  revalidatePath("/crm/hrms/advances");
  return { ok: true };
}

export async function setAdvanceStatus(formData: FormData): Promise<CrmResult> {
  const g = await guardManager();
  if ("error" in g) return { ok: false, error: g.error };

  const parsed = z.object({
    id: uuid,
    status: z.enum(["pending", "settled", "cancelled"]),
  }).safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) return { ok: false, error: "Invalid status." };

  const supabase = await createCrmClient();
  const { error } = await supabase
    .from("advance_salaries")
    .update({ status: parsed.data.status })
    .eq("id", parsed.data.id);

  if (error) return fail(error, "Could not update the advance.");
  revalidatePath("/crm/hrms/advances");
  return { ok: true };
}

// ── Finance ──────────────────────────────────────────────────────────────────

export async function submitExpense(formData: FormData): Promise<CrmResult> {
  const g = await guard();
  if ("error" in g) return { ok: false, error: g.error };

  const parsed = z.object({
    category: z.enum(EXPENSE_CATEGORIES),
    description: z.string().trim().min(2).max(300),
    amount: z.coerce.number().positive("Amount must be more than zero"),
    expense_date: z.iso.date(),
    payment_mode: z.string().trim().max(40).optional(),
    bill_url: z.string().trim().max(500).optional(),
    notes: z.string().trim().max(500).optional(),
  }).safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Check the fields." };
  }
  const d = parsed.data;

  const supabase = await createCrmClient();
  const { error } = await supabase.from("expenses").insert({
    category: d.category,
    description: d.description,
    amount: d.amount,
    expense_date: d.expense_date,
    payment_mode: blank(d.payment_mode),
    bill_url: blank(d.bill_url),
    notes: blank(d.notes),
    submitted_by: g.staff.id,
    status: "pending",
  });

  if (error) return fail(error, "Could not submit the expense.");
  revalidatePath("/crm/finance");
  return { ok: true };
}

export async function decideExpense(formData: FormData): Promise<CrmResult> {
  const g = await guardManager();
  if ("error" in g) return { ok: false, error: g.error };

  const parsed = z.object({
    id: uuid,
    status: z.enum(APPROVAL_STATUSES),
  }).safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) return { ok: false, error: "Invalid decision." };

  const supabase = await createCrmClient();
  const { error, count } = await supabase
    .from("expenses")
    .update({ status: parsed.data.status, approved_by: g.staff.id }, { count: "exact" })
    .eq("id", parsed.data.id);

  if (error) return fail(error, "Could not record the decision.");
  if (!count) return { ok: false, error: "Only a manager can approve an expense." };

  revalidatePath("/crm/finance");
  return { ok: true };
}

// ── Litigation ───────────────────────────────────────────────────────────────

export async function saveLitigation(formData: FormData): Promise<CrmResult> {
  const g = await guardManager();
  if ("error" in g) return { ok: false, error: g.error };

  const parsed = z.object({
    id: z.union([uuid, z.literal("")]).optional(),
    department_id: uuid,
    session_id: z.union([uuid, z.literal("")]).optional(),
    student_name: z.string().trim().min(2).max(120),
    father_name: z.string().trim().max(120).optional(),
    phone: z.string().trim().max(20).optional(),
    litigation_amount: z.coerce.number().min(0),
    amount_paid: z.coerce.number().min(0),
    notes: z.string().trim().max(1000).optional(),
  }).safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Check the fields." };
  }
  const d = parsed.data;

  const row = {
    department_id: d.department_id,
    session_id: blank(d.session_id),
    student_name: d.student_name,
    father_name: blank(d.father_name),
    phone: blank(d.phone),
    litigation_amount: d.litigation_amount,
    amount_paid: d.amount_paid,
    notes: blank(d.notes),
  };

  const supabase = await createCrmClient();
  const { error } = d.id
    ? await supabase.from("department_litigations").update(row).eq("id", d.id)
    : await supabase.from("department_litigations").insert(row);

  if (error) return fail(error, "Could not save the case.");
  revalidatePath("/crm/litigation");
  return { ok: true };
}

// ── Mentorship ───────────────────────────────────────────────────────────────

export async function createMentorship(formData: FormData): Promise<CrmResult> {
  const g = await guard();
  if ("error" in g) return { ok: false, error: g.error };

  const parsed = z.object({
    student_id: uuid,
    telecaller_id: uuid,
    task_type: z.enum(["work_assignment", "practical", "exam"]),
    description: z.string().trim().max(1000).optional(),
  }).safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) return { ok: false, error: "Check the fields." };

  const supabase = await createCrmClient();
  const { error } = await supabase.from("student_mentorships").insert({
    student_id: parsed.data.student_id,
    telecaller_id: parsed.data.telecaller_id,
    task_type: parsed.data.task_type,
    description: blank(parsed.data.description),
    created_by: g.staff.id,
  });

  if (error) return fail(error, "Could not create the assignment.");
  revalidatePath("/crm/mentorship");
  return { ok: true };
}

export async function decideMentorship(formData: FormData): Promise<CrmResult> {
  const g = await guardManager();
  if ("error" in g) return { ok: false, error: g.error };

  const parsed = z.object({
    id: uuid,
    status: z.enum(APPROVAL_STATUSES),
    rating: z.union([z.coerce.number().min(0).max(10), z.nan()]).optional(),
    salary_percentage: z.union([z.coerce.number().min(0).max(100), z.nan()]).optional(),
    admin_remarks: z.string().trim().max(1000).optional(),
  }).safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) return { ok: false, error: "Check the fields." };
  const d = parsed.data;

  const supabase = await createCrmClient();
  const { error, count } = await supabase
    .from("student_mentorships")
    .update(
      {
        status: d.status,
        rating: num(d.rating),
        salary_percentage: num(d.salary_percentage),
        admin_remarks: blank(d.admin_remarks),
        approved_by: g.staff.id,
        approved_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      { count: "exact" },
    )
    .eq("id", d.id);

  if (error) return fail(error, "Could not record the decision.");
  if (!count) return { ok: false, error: "Only a manager can decide a mentorship." };

  revalidatePath("/crm/mentorship");
  return { ok: true };
}

// ── Targets ──────────────────────────────────────────────────────────────────

export async function saveTarget(formData: FormData): Promise<CrmResult> {
  const g = await guardManager();
  if ("error" in g) return { ok: false, error: g.error };

  const parsed = z.object({
    id: z.union([uuid, z.literal("")]).optional(),
    assignee_id: uuid,
    title: z.string().trim().min(2).max(120),
    target_amount: z.coerce.number().min(0),
    lead_target: z.coerce.number().int().min(0),
    conversion_target: z.coerce.number().int().min(0),
    period_type: z.enum(TARGET_PERIODS),
    start_date: z.iso.date(),
    end_date: z.iso.date(),
    bonus_percentage: z.coerce.number().min(0),
    notes: z.string().trim().max(500).optional(),
  }).safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Check the fields." };
  }
  const d = parsed.data;

  if (d.end_date < d.start_date) {
    return { ok: false, error: "The end date cannot be before the start date." };
  }

  const row = {
    assignee_id: d.assignee_id,
    title: d.title,
    target_amount: d.target_amount,
    lead_target: d.lead_target,
    conversion_target: d.conversion_target,
    period_type: d.period_type,
    start_date: d.start_date,
    end_date: d.end_date,
    bonus_percentage: d.bonus_percentage,
    notes: blank(d.notes),
    created_by: g.staff.id,
  };

  const supabase = await createCrmClient();
  const { error } = d.id
    ? await supabase.from("revenue_targets").update(row).eq("id", d.id)
    : await supabase.from("revenue_targets").insert(row);

  if (error) return fail(error, "Could not save the target.");
  revalidatePath("/crm/targets");
  return { ok: true };
}

export async function archiveTarget(formData: FormData): Promise<CrmResult> {
  const g = await guardManager();
  if ("error" in g) return { ok: false, error: g.error };

  const parsed = uuid.safeParse(formData.get("id"));
  if (!parsed.success) return { ok: false, error: "Invalid target." };

  const supabase = await createCrmClient();
  const { error } = await supabase
    .from("revenue_targets").update({ status: "archived" }).eq("id", parsed.data);

  if (error) return fail(error, "Could not archive the target.");
  revalidatePath("/crm/targets");
  return { ok: true };
}

// ── Notifications ────────────────────────────────────────────────────────────

export async function sendNotification(formData: FormData): Promise<CrmResult> {
  const g = await guard();
  if ("error" in g) return { ok: false, error: g.error };

  const parsed = z.object({
    title: z.string().trim().min(2).max(160),
    message: z.string().trim().min(2).max(2000),
    type: z.enum(NOTIFICATION_TYPES),
    target_role: z.string().trim().max(40).optional(),
  }).safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Check the fields." };
  }

  const supabase = await createCrmClient();
  const { error } = await supabase.from("notifications").insert({
    title: parsed.data.title,
    message: parsed.data.message,
    type: parsed.data.type,
    target_role: blank(parsed.data.target_role),
    created_by: g.staff.id,
  });

  if (error) return fail(error, "Could not send the notification.");
  revalidatePath("/crm/notifications");
  return { ok: true };
}

// ── Settings reference data ──────────────────────────────────────────────────

const REFERENCE_TABLES = [
  "departments",
  "department_sub_sections",
  "sessions",
  "courses",
  "sub_courses",
] as const;

export async function saveReferenceRow(formData: FormData): Promise<CrmResult> {
  const g = await guardManager();
  if ("error" in g) return { ok: false, error: g.error };

  const parsed = z.object({
    table: z.enum(REFERENCE_TABLES),
    id: z.union([uuid, z.literal("")]).optional(),
    name: z.string().trim().min(1).max(160),
    parent_id: z.union([uuid, z.literal("")]).optional(),
    is_active: z.string().optional(),
  }).safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) return { ok: false, error: "Give it a name." };
  const d = parsed.data;

  // Each child table names its parent column differently; the form only ever
  // sends `parent_id`, so map it here rather than teaching the client five
  // different field names.
  const parentColumn: Partial<Record<(typeof REFERENCE_TABLES)[number], string>> = {
    department_sub_sections: "department_id",
    sub_courses: "course_id",
  };

  const row: Record<string, unknown> = {
    name: d.name,
    is_active: d.is_active === "on" || d.is_active === "true",
  };
  const parent = parentColumn[d.table];
  if (parent) {
    if (!d.parent_id) return { ok: false, error: "Pick the parent first." };
    row[parent] = d.parent_id;
  }

  const supabase = await createCrmClient();
  const { error } = d.id
    ? await supabase.from(d.table).update(row).eq("id", d.id)
    : await supabase.from(d.table).insert(row);

  if (error) return fail(error, "Could not save.");
  revalidatePath("/crm/settings");
  return { ok: true };
}

export async function toggleReferenceRow(formData: FormData): Promise<CrmResult> {
  const g = await guardManager();
  if ("error" in g) return { ok: false, error: g.error };

  const parsed = z.object({
    table: z.enum(REFERENCE_TABLES),
    id: uuid,
    is_active: z.enum(["true", "false"]),
  }).safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) return { ok: false, error: "Invalid row." };

  const supabase = await createCrmClient();
  const { error } = await supabase
    .from(parsed.data.table)
    .update({ is_active: parsed.data.is_active === "true" })
    .eq("id", parsed.data.id);

  if (error) return fail(error, "Could not update.");
  revalidatePath("/crm/settings");
  return { ok: true };
}

export async function saveFormField(formData: FormData): Promise<CrmResult> {
  const g = await guardManager();
  if ("error" in g) return { ok: false, error: g.error };

  const parsed = z.object({
    id: uuid,
    label: z.string().trim().min(1).max(120),
    is_required: z.string().optional(),
    is_active: z.string().optional(),
    display_order: z.coerce.number().int().min(0),
  }).safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) return { ok: false, error: "Check the fields." };

  const supabase = await createCrmClient();
  const { error } = await supabase
    .from("lead_form_fields")
    .update({
      label: parsed.data.label,
      is_required: parsed.data.is_required === "on",
      is_active: parsed.data.is_active === "on",
      display_order: parsed.data.display_order,
    })
    .eq("id", parsed.data.id);

  if (error) return fail(error, "Could not save the field.");
  revalidatePath("/crm/settings");
  return { ok: true };
}
