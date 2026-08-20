"use server";

import { revalidatePath } from "next/cache";

import { z } from "zod";

import { CRM_LEAD_SOURCES, CRM_LEAD_STATUSES, PAYMENT_MODES } from "@/config/crm";
import { can, requireStaff } from "@/lib/auth";
import { createCrmClient } from "@/lib/supabase/crm";

/**
 * CRM mutations — PRD §2: Server Actions running with the session's JWT so RLS
 * enforces who may touch which lead. `requireStaff` is a fast fail with a
 * useful redirect, not the boundary.
 *
 * Every write that changes a lead's meaning also writes a `lead_activities`
 * row. The timeline is how a counsellor picking up someone else's lead knows
 * what already happened, so leaving a gap in it is worse than the write
 * failing.
 */
export type CrmResult = { ok: boolean; error?: string };

const uuid = z.uuid();

async function guard() {
  const staff = await requireStaff();
  if (!can(staff.role, "leads")) {
    return { error: "Your account cannot work leads." as const };
  }
  return { staff };
}

async function logActivity(
  supabase: Awaited<ReturnType<typeof createCrmClient>>,
  leadId: string,
  activityType: string,
  fields: { old?: string | null; next?: string | null; note?: string | null },
  userId: string,
) {
  await supabase.from("lead_activities").insert({
    lead_id: leadId,
    activity_type: activityType,
    old_value: fields.old ?? null,
    new_value: fields.next ?? null,
    note: fields.note ?? null,
    performed_by: userId,
  });
}

function refresh(leadId?: string) {
  revalidatePath("/admin/crm/leads");
  if (leadId) revalidatePath(`/admin/crm/leads/${leadId}`);
  revalidatePath("/admin/crm");
}

const statusInput = z.object({
  id: uuid,
  status: z.enum(CRM_LEAD_STATUSES),
  custom_status: z.string().trim().max(60).optional(),
});

export async function setLeadStatus(formData: FormData): Promise<CrmResult> {
  const g = await guard();
  if ("error" in g) return { ok: false, error: g.error };

  const parsed = statusInput.safeParse({
    id: formData.get("id"),
    status: formData.get("status"),
    custom_status: formData.get("custom_status") ?? undefined,
  });
  if (!parsed.success) return { ok: false, error: "Invalid status." };

  const supabase = await createCrmClient();
  const { data: before } = await supabase
    .from("leads").select("status").eq("id", parsed.data.id).maybeSingle();

  const { error } = await supabase
    .from("leads")
    .update({
      status: parsed.data.status,
      // The free-text label only means anything on the 'custom' status.
      custom_status:
        parsed.data.status === "custom" ? (parsed.data.custom_status || null) : null,
    })
    .eq("id", parsed.data.id);

  if (error) return { ok: false, error: error.message };

  await logActivity(supabase, parsed.data.id, "status_changed",
    { old: before?.status ?? null, next: parsed.data.status }, g.staff.id);

  refresh(parsed.data.id);
  return { ok: true };
}

const assignInput = z.object({
  id: uuid,
  // "" means unassign.
  assigned_to: z.union([uuid, z.literal("")]),
});

export async function assignLead(formData: FormData): Promise<CrmResult> {
  const g = await guard();
  if ("error" in g) return { ok: false, error: g.error };

  const parsed = assignInput.safeParse({
    id: formData.get("id"),
    assigned_to: formData.get("assigned_to") ?? "",
  });
  if (!parsed.success) return { ok: false, error: "Invalid assignee." };

  const target = parsed.data.assigned_to || null;
  const supabase = await createCrmClient();

  const { error } = await supabase
    .from("leads")
    .update({ assigned_to: target, assigned_at: target ? new Date().toISOString() : null })
    .eq("id", parsed.data.id);

  if (error) return { ok: false, error: error.message };

  await logActivity(supabase, parsed.data.id, target ? "assigned" : "transferred",
    { next: target }, g.staff.id);

  refresh(parsed.data.id);
  return { ok: true };
}

const followUpInput = z.object({
  id: uuid,
  date: z.union([z.iso.date(), z.literal("")]),
  note: z.string().trim().max(500).optional(),
});

export async function setFollowUp(formData: FormData): Promise<CrmResult> {
  const g = await guard();
  if ("error" in g) return { ok: false, error: g.error };

  const parsed = followUpInput.safeParse({
    id: formData.get("id"),
    date: formData.get("date") ?? "",
    note: formData.get("note") ?? undefined,
  });
  if (!parsed.success) return { ok: false, error: "Pick a valid date." };

  const supabase = await createCrmClient();
  const { error } = await supabase
    .from("leads")
    .update({ next_followup_date: parsed.data.date || null })
    .eq("id", parsed.data.id);

  if (error) return { ok: false, error: error.message };

  await logActivity(supabase, parsed.data.id, "followup_set",
    { next: parsed.data.date || null, note: parsed.data.note ?? null }, g.staff.id);

  refresh(parsed.data.id);
  return { ok: true };
}

const noteInput = z.object({ id: uuid, note: z.string().trim().min(1).max(2000) });

export async function addLeadNote(formData: FormData): Promise<CrmResult> {
  const g = await guard();
  if ("error" in g) return { ok: false, error: g.error };

  const parsed = noteInput.safeParse({ id: formData.get("id"), note: formData.get("note") });
  if (!parsed.success) return { ok: false, error: "Write something first." };

  const supabase = await createCrmClient();
  await logActivity(supabase, parsed.data.id, "note_added", { note: parsed.data.note }, g.staff.id);

  refresh(parsed.data.id);
  return { ok: true };
}

const detailsInput = z.object({
  id: uuid,
  full_name: z.string().trim().min(2).max(120),
  phone: z.string().trim().min(6).max(20),
  email: z.union([z.email(), z.literal("")]).optional(),
  city: z.string().trim().max(80).optional(),
  state: z.string().trim().max(80).optional(),
  source: z.enum(CRM_LEAD_SOURCES),
  mode: z.union([z.enum(["attending", "non-attending"]), z.literal("")]).optional(),
  course_id: z.union([uuid, z.literal("")]).optional(),
  sub_course_id: z.union([uuid, z.literal("")]).optional(),
  session_id: z.union([uuid, z.literal("")]).optional(),
  department_id: z.union([uuid, z.literal("")]).optional(),
  sub_section_id: z.union([uuid, z.literal("")]).optional(),
  total_fee: z.union([z.coerce.number().min(0), z.nan()]).optional(),
  amount_paid: z.union([z.coerce.number().min(0), z.nan()]).optional(),
  enrollment_date: z.union([z.iso.date(), z.literal("")]).optional(),
});

const blank = (v: string | undefined) => (v && v !== "" ? v : null);
const num = (v: number | undefined) =>
  v === undefined || Number.isNaN(v) ? null : v;

export async function saveLeadDetails(formData: FormData): Promise<CrmResult> {
  const g = await guard();
  if ("error" in g) return { ok: false, error: g.error };

  const raw = Object.fromEntries(formData.entries()) as Record<string, string>;
  const parsed = detailsInput.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Check the fields." };
  }
  const d = parsed.data;

  const supabase = await createCrmClient();
  const { error } = await supabase
    .from("leads")
    .update({
      full_name: d.full_name,
      phone: d.phone,
      email: blank(d.email),
      city: blank(d.city),
      state: blank(d.state),
      source: d.source,
      mode: blank(d.mode),
      course_id: blank(d.course_id),
      sub_course_id: blank(d.sub_course_id),
      session_id: blank(d.session_id),
      department_id: blank(d.department_id),
      sub_section_id: blank(d.sub_section_id),
      total_fee: num(d.total_fee),
      amount_paid: num(d.amount_paid) ?? 0,
      enrollment_date: blank(d.enrollment_date),
    })
    .eq("id", d.id);

  if (error) return { ok: false, error: error.message };

  refresh(d.id);
  return { ok: true };
}

const createInput = detailsInput.omit({ id: true });

export async function createLead(formData: FormData): Promise<CrmResult & { id?: string }> {
  const g = await guard();
  if ("error" in g) return { ok: false, error: g.error };

  const raw = Object.fromEntries(formData.entries()) as Record<string, string>;
  const parsed = createInput.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Check the fields." };
  }
  const d = parsed.data;

  const supabase = await createCrmClient();
  const { data, error } = await supabase
    .from("leads")
    .insert({
      full_name: d.full_name,
      phone: d.phone,
      email: blank(d.email),
      city: blank(d.city),
      state: blank(d.state),
      source: d.source,
      mode: blank(d.mode),
      course_id: blank(d.course_id),
      sub_course_id: blank(d.sub_course_id),
      session_id: blank(d.session_id),
      department_id: blank(d.department_id),
      sub_section_id: blank(d.sub_section_id),
      total_fee: num(d.total_fee),
      amount_paid: num(d.amount_paid) ?? 0,
      enrollment_date: blank(d.enrollment_date),
      created_by: g.staff.id,
      assigned_to: g.staff.id,
      assigned_at: new Date().toISOString(),
    })
    .select("id")
    .single();

  if (error || !data) return { ok: false, error: error?.message ?? "Could not create." };

  await logActivity(supabase, data.id, "created", { next: "new" }, g.staff.id);
  refresh();
  return { ok: true, id: data.id };
}

/**
 * Deleting a lead is a manager decision — a telecaller who cannot reach someone
 * marks them `lost`, they do not erase the record. RLS enforces this; the
 * message here just explains the refusal.
 */
export async function deleteLead(formData: FormData): Promise<CrmResult> {
  const g = await guard();
  if ("error" in g) return { ok: false, error: g.error };

  const parsed = uuid.safeParse(formData.get("id"));
  if (!parsed.success) return { ok: false, error: "Invalid lead." };

  const supabase = await createCrmClient();
  const { error, count } = await supabase
    .from("leads")
    .delete({ count: "exact" })
    .eq("id", parsed.data);

  if (error) return { ok: false, error: error.message };
  if (!count) {
    return { ok: false, error: "Only a manager can delete a lead. Mark it lost instead." };
  }

  refresh();
  return { ok: true };
}

const paymentInput = z.object({
  student_id: uuid,
  amount: z.coerce.number().positive("Amount must be more than zero"),
  payment_mode: z.enum(PAYMENT_MODES),
  payment_date: z.iso.date(),
  receipt_number: z.string().trim().max(60).optional(),
  notes: z.string().trim().max(500).optional(),
});

/**
 * Records a payment and moves the student's running total.
 *
 * The two writes are not in one transaction — PostgREST has no transaction
 * across calls — so the payment row is written first. A payment recorded but
 * not yet totalled is recoverable; a total moved with no receipt behind it is
 * not.
 */
export async function recordPayment(formData: FormData): Promise<CrmResult> {
  const g = await guard();
  if ("error" in g) return { ok: false, error: g.error };

  const raw = Object.fromEntries(formData.entries()) as Record<string, string>;
  const parsed = paymentInput.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Check the fields." };
  }
  const d = parsed.data;

  const supabase = await createCrmClient();
  const { error } = await supabase.from("payments").insert({
    student_id: d.student_id,
    amount: d.amount,
    payment_mode: d.payment_mode,
    payment_date: d.payment_date,
    receipt_number: blank(d.receipt_number),
    notes: blank(d.notes),
    recorded_by: g.staff.id,
  });
  if (error) return { ok: false, error: error.message };

  // Recomputed from the receipts, not incremented from the old value. Two
  // counsellors recording a payment at the same moment would both read the
  // same `amount_paid` and one write would be lost; summing means the very
  // next payment repairs the total instead of the error compounding.
  const { data: receipts } = await supabase
    .from("payments").select("amount").eq("student_id", d.student_id);

  if (receipts) {
    await supabase
      .from("students")
      .update({
        amount_paid: receipts.reduce((sum, r) => sum + Number(r.amount ?? 0), 0),
      })
      .eq("id", d.student_id);
  }

  revalidatePath(`/admin/crm/students/${d.student_id}`);
  revalidatePath("/admin/crm/students");
  return { ok: true };
}

const studentStatusInput = z.object({
  id: uuid,
  status: z.enum(["pending", "active", "completed", "dropped", "on_hold"]),
  drop_reason: z.string().trim().max(300).optional(),
});

export async function setStudentStatus(formData: FormData): Promise<CrmResult> {
  const g = await guard();
  if ("error" in g) return { ok: false, error: g.error };

  const parsed = studentStatusInput.safeParse({
    id: formData.get("id"),
    status: formData.get("status"),
    drop_reason: formData.get("drop_reason") ?? undefined,
  });
  if (!parsed.success) return { ok: false, error: "Invalid status." };

  const supabase = await createCrmClient();
  const { error, count } = await supabase
    .from("students")
    .update(
      {
        status: parsed.data.status,
        drop_reason:
          parsed.data.status === "dropped" ? (parsed.data.drop_reason || null) : null,
      },
      { count: "exact" },
    )
    .eq("id", parsed.data.id);

  if (error) return { ok: false, error: error.message };
  if (!count) return { ok: false, error: "Only a manager can change a student's status." };

  revalidatePath("/admin/crm/students");
  revalidatePath(`/admin/crm/students/${parsed.data.id}`);
  return { ok: true };
}
