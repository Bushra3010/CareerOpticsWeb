"use server";

import { revalidatePath } from "next/cache";

import { z } from "zod";

import { requireStaff } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

/**
 * Review moderation — PRD §5.5 `/admin/reviews` (approve/reject).
 *
 * Approving is what makes a review public *and* what recomputes
 * `colleges.rating` — the 0004 trigger only moves the aggregate when an
 * approved row is involved. So this action is the only path by which a
 * college's public rating can change.
 */
const input = z.object({ id: z.uuid() });

export type ActionResult = { ok: boolean; error?: string };

export async function approveReview(formData: FormData): Promise<ActionResult> {
  await requireStaff();

  const parsed = input.safeParse({ id: formData.get("id") });
  if (!parsed.success) return { ok: false, error: "Invalid review." };

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("reviews")
    .update({ is_approved: true })
    .eq("id", parsed.data.id)
    .select("college_id, colleges(slug)")
    .maybeSingle();

  if (error) return { ok: false, error: error.message };

  revalidatePath("/admin/reviews");
  // The college page shows the review and the recomputed rating.
  if (data?.colleges?.slug) revalidatePath(`/colleges/${data.colleges.slug}`);
  return { ok: true };
}

/**
 * Rejecting deletes the row rather than parking it unapproved.
 *
 * An unapproved review is invisible to `anon` either way, so keeping spam
 * around only grows a table nobody reads. Deleting also lets the same student
 * resubmit a cleaner review without hitting a duplicate.
 */
export async function rejectReview(formData: FormData): Promise<ActionResult> {
  await requireStaff();

  const parsed = input.safeParse({ id: formData.get("id") });
  if (!parsed.success) return { ok: false, error: "Invalid review." };

  const supabase = await createClient();
  const { error } = await supabase
    .from("reviews")
    .delete()
    .eq("id", parsed.data.id);

  if (error) return { ok: false, error: error.message };

  revalidatePath("/admin/reviews");
  return { ok: true };
}

/** Un-approving pulls a published review back down and drops it from the rating. */
export async function unapproveReview(formData: FormData): Promise<ActionResult> {
  await requireStaff();

  const parsed = input.safeParse({ id: formData.get("id") });
  if (!parsed.success) return { ok: false, error: "Invalid review." };

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("reviews")
    .update({ is_approved: false })
    .eq("id", parsed.data.id)
    .select("colleges(slug)")
    .maybeSingle();

  if (error) return { ok: false, error: error.message };

  revalidatePath("/admin/reviews");
  if (data?.colleges?.slug) revalidatePath(`/colleges/${data.colleges.slug}`);
  return { ok: true };
}
