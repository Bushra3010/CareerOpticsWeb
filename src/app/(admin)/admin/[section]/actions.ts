"use server";

import { revalidatePath } from "next/cache";

import { z } from "zod";

import { can, requireStaff } from "@/lib/auth";
import { findSection } from "@/config/admin-content";
import { createClient } from "@/lib/supabase/server";

/**
 * Visibility and delete for any managed content section — PRD §5.5.
 *
 * The table name comes from an **allowlist keyed by section slug**, never from
 * the request. A caller cannot post `table=profiles` and have this write to it.
 * RLS still gates every write on `is_staff()`; this is defence in depth.
 */

const input = z.object({
  section: z.string().min(1),
  id: z.uuid(),
  /** Present for a visibility change, absent for a delete. */
  value: z.string().optional(),
});

export type ActionResult = { ok: boolean; error?: string };

async function resolve(formData: FormData) {
  const staff = await requireStaff();
  if (!can(staff.role, "content")) {
    return { error: "Your account cannot edit content." as const };
  }

  const parsed = input.safeParse({
    section: formData.get("section"),
    id: formData.get("id"),
    value: formData.get("value") ?? undefined,
  });
  if (!parsed.success) return { error: "Invalid request." as const };

  const section = findSection(parsed.data.section);
  if (!section) return { error: "Unknown section." as const };

  // Note the order: `parsed.data` also carries a `section` (the slug string),
  // so the resolved object has to come last or it gets clobbered.
  return { ...parsed.data, section };
}

export async function setVisibility(formData: FormData): Promise<ActionResult> {
  const resolved = await resolve(formData);
  if ("error" in resolved) return { ok: false, error: resolved.error };

  const { section, id, value } = resolved;
  if (!section.visibility) {
    return { ok: false, error: "This section has no publish state." };
  }

  const supabase = await createClient();

  // Two shapes: a `content_status` enum or a boolean `is_active`.
  const patch =
    section.visibility === "status"
      ? { status: value === "published" ? ("published" as const) : ("draft" as const) }
      : { is_active: value === "true" };

  const { error } = await supabase
    .from(section.table)
    .update(patch as never)
    .eq("id", id);

  if (error) return { ok: false, error: error.message };

  revalidatePath(`/admin/${section.slug}`);
  // The public route this row feeds is ISR-cached; publishing has to bust it.
  revalidatePath("/", "layout");
  return { ok: true };
}

export async function deleteRow(formData: FormData): Promise<ActionResult> {
  const resolved = await resolve(formData);
  if ("error" in resolved) return { ok: false, error: resolved.error };

  const { section, id } = resolved;
  const supabase = await createClient();

  const { error } = await supabase.from(section.table).delete().eq("id", id);
  if (error) return { ok: false, error: error.message };

  revalidatePath(`/admin/${section.slug}`);
  revalidatePath("/", "layout");
  return { ok: true };
}
