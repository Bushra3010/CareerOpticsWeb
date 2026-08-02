"use server";

import { revalidatePath } from "next/cache";

import { z } from "zod";

import { can, requireStaff } from "@/lib/auth";
import { fieldsFor, type Field } from "@/config/admin-fields";
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


/**
 * Create or update a row — PRD §5.5 CRUD.
 *
 * Values are coerced per `config/admin-fields.ts`, and **only** the columns
 * that config declares are written. A caller cannot post `status=published` at
 * a section whose config has no status field, or slip an extra column in.
 */
export type SaveResult = ActionResult & { fields?: Record<string, string> };

function coerce(field: Field, raw: FormDataEntryValue | null) {
  const value = typeof raw === "string" ? raw.trim() : "";

  switch (field.kind) {
    case "boolean":
      // The hidden companion input means "true" is present only when ticked.
      return value === "true";
    case "number":
      return value === "" ? null : Number(value);
    case "list":
      return value === ""
        ? null
        : value.split(",").map((part) => part.trim()).filter(Boolean);
    case "date":
      return value === "" ? null : value;
    default:
      return value === "" ? null : value;
  }
}

export async function saveRow(formData: FormData): Promise<SaveResult> {
  const staff = await requireStaff();
  if (!can(staff.role, "content")) {
    return { ok: false, error: "Your account cannot edit content." };
  }

  const sectionSlug = String(formData.get("section") ?? "");
  const section = findSection(sectionSlug);
  if (!section) return { ok: false, error: "Unknown section." };

  const fields = fieldsFor(sectionSlug);
  if (fields.length === 0) {
    return { ok: false, error: "This section has no editable fields." };
  }

  const id = formData.get("id");
  const patch: Record<string, unknown> = {};
  const fieldErrors: Record<string, string> = {};

  for (const field of fields) {
    const value = coerce(field, formData.get(field.name));

    if (field.required && (value === null || value === "")) {
      fieldErrors[field.name] = `${field.label} is required`;
      continue;
    }
    if (field.kind === "number" && typeof value === "number" && Number.isNaN(value)) {
      fieldErrors[field.name] = `${field.label} must be a number`;
      continue;
    }
    if (field.kind === "slug" && typeof value === "string" && !/^[a-z0-9-]+$/.test(value)) {
      fieldErrors[field.name] = "Use lowercase letters, numbers and hyphens only";
      continue;
    }
    patch[field.name] = value;
  }

  if (Object.keys(fieldErrors).length > 0) {
    return { ok: false, error: "Check the highlighted fields.", fields: fieldErrors };
  }

  const supabase = await createClient();

  const { error } = id
    ? await supabase.from(section.table).update(patch as never).eq("id", String(id))
    : await supabase.from(section.table).insert(patch as never);

  if (error) {
    // A duplicate slug is the common one and deserves a useful message.
    const message = /duplicate key|unique constraint/i.test(error.message)
      ? "That slug is already taken — slugs must be unique."
      : error.message;
    return { ok: false, error: message };
  }

  revalidatePath(`/admin/${section.slug}`);
  // The public route this row feeds is ISR-cached; a save has to bust it.
  revalidatePath("/", "layout");
  return { ok: true };
}
