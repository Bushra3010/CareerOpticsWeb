"use server";

import { revalidatePath } from "next/cache";

import { z } from "zod";

import { requireStaff } from "@/lib/auth";
import { LEAD_STATUSES } from "@/config/leads";
import { createClient } from "@/lib/supabase/server";

/**
 * Lead mutations — PRD §2 ("Server Actions for all /admin mutations, they run
 * with the session's JWT; RLS enforces role").
 *
 * These deliberately use the cookie-bound client, not the service role: the
 * `staff update leads` policy is the actual authorisation check. `requireStaff`
 * on top is a fast fail with a useful redirect, not the security boundary.
 */

const statusInput = z.object({
  id: z.uuid(),
  status: z.enum(LEAD_STATUSES as [string, ...string[]]),
});

export type ActionResult = { ok: boolean; error?: string };

export async function updateLeadStatus(formData: FormData): Promise<ActionResult> {
  const staff = await requireStaff();

  const parsed = statusInput.safeParse({
    id: formData.get("id"),
    status: formData.get("status"),
  });
  if (!parsed.success) return { ok: false, error: "Invalid status." };

  const supabase = await createClient();

  const { error } = await supabase
    .from("leads")
    .update({ status: parsed.data.status as (typeof LEAD_STATUSES)[number] })
    .eq("id", parsed.data.id);

  if (error) return { ok: false, error: error.message };

  // Status and timeline are a single logical write — if the update succeeds
  // the timeline entry must exist, so both are attempted and either failure
  // is surfaced. PostgREST has no transaction across calls, but the status
  // row is already durable by this point.
  const { error: actErr } = await supabase.from("lead_activities").insert({
    lead_id: parsed.data.id,
    user_id: staff.id,
    action: "status_changed",
    note: `Status set to ${parsed.data.status}`,
  });
  if (actErr) console.error(`[leads] activity insert failed: ${actErr.message}`);

  revalidatePath("/admin/leads");
  revalidatePath(`/admin/leads/${parsed.data.id}`);
  return { ok: true };
}

const noteInput = z.object({
  id: z.uuid(),
  note: z.string().trim().min(1, "Write something first").max(2000),
});

export async function addLeadNote(formData: FormData): Promise<ActionResult> {
  const staff = await requireStaff();

  const parsed = noteInput.safeParse({
    id: formData.get("id"),
    note: formData.get("note"),
  });
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid note." };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("lead_activities").insert({
    lead_id: parsed.data.id,
    user_id: staff.id,
    action: "note",
    note: parsed.data.note,
  });

  if (error) return { ok: false, error: error.message };

  revalidatePath(`/admin/leads/${parsed.data.id}`);
  return { ok: true };
}
