"use server";

import { revalidatePath } from "next/cache";

import { z } from "zod";

import { CRM_LEAD_SOURCES } from "@/config/crm";
import {
  IMPORT_COLUMNS,
  guessMapping,
  type ImportPreview,
  type ImportResult,
} from "@/config/crm-import";
import { can, requireStaff } from "@/lib/auth";
import { csvToRecords } from "@/lib/csv";
import { createCrmAdminClient, createCrmClient } from "@/lib/supabase/crm";

/**
 * Bulk lead import — PRD §5.5, ported from the CRM's Excel importer.
 *
 * CSV only. The npm `xlsx` build the source CRM used is pinned at 0.18.5 with
 * open prototype-pollution and ReDoS advisories, and parsing staff uploads
 * with it is not worth one screen. Excel's "Save as CSV" covers it.
 */

const MAX_ROWS = 2000;
/** `in.(...)` travels in the URL, so the lookup is split into short batches. */
const LOOKUP_CHUNK = 200;
/** Keeps any single insert body small enough to retry cheaply. */
const INSERT_CHUNK = 250;

export async function previewImport(formData: FormData): Promise<ImportPreview> {
  const staff = await requireStaff();
  if (!can(staff.role, "leads")) return { ok: false, error: "Not allowed." };

  const file = formData.get("file");
  if (!(file instanceof File)) return { ok: false, error: "Choose a CSV file." };
  if (file.size > 5 * 1024 * 1024) return { ok: false, error: "File must be under 5 MB." };

  const { headers, records } = csvToRecords(await file.text());
  if (headers.length === 0) return { ok: false, error: "That file has no header row." };
  if (records.length === 0) return { ok: false, error: "No data rows found." };

  return {
    ok: true,
    headers,
    // Only the first few go to the client; the whole file is re-read on commit.
    rows: records.slice(0, 5),
    mapping: guessMapping(headers),
    total: records.length,
  };
}

const commitSchema = z.object({
  source: z.enum(CRM_LEAD_SOURCES),
  assign_to_me: z.string().optional(),
});

/** Last ten digits — the same key `crm.leads.phone_last10` is built from. */
function last10(phone: string) {
  return phone.replace(/\D/g, "").slice(-10);
}

export async function commitImport(formData: FormData): Promise<ImportResult> {
  const staff = await requireStaff();
  if (!can(staff.role, "leads")) return { ok: false, error: "Not allowed." };

  const file = formData.get("file");
  if (!(file instanceof File)) return { ok: false, error: "Choose a CSV file." };

  const parsed = commitSchema.safeParse({
    source: formData.get("source"),
    assign_to_me: formData.get("assign_to_me") ?? undefined,
  });
  if (!parsed.success) return { ok: false, error: "Pick a source." };

  const mapping: Record<string, string> = {};
  for (const column of IMPORT_COLUMNS) {
    const header = formData.get(`map_${column.key}`);
    if (typeof header === "string" && header) mapping[column.key] = header;
  }
  if (!mapping.full_name || !mapping.phone) {
    return { ok: false, error: "Name and Phone must both be mapped." };
  }

  const { records } = csvToRecords(await file.text());
  if (records.length === 0) return { ok: false, error: "No data rows found." };
  if (records.length > MAX_ROWS) {
    return { ok: false, error: `That file has ${records.length} rows. Split it into files of ${MAX_ROWS} or fewer.` };
  }

  // Timestamp plus a short random tail — two imports in the same second would
  // otherwise be filed under one batch and could not be told apart.
  const batchId = `import-${new Date().toISOString().slice(0, 19).replace(/[:T-]/g, "")}-${Math.random().toString(36).slice(2, 6)}`;
  const crm = await createCrmClient();

  // Course names in a spreadsheet are text; match them to real rows so the
  // lead is filterable, and leave unmatched ones null rather than inventing.
  const { data: courses } = await crm.from("courses").select("id, name");
  const courseByName = new Map(
    (courses ?? []).map((c) => [String(c.name).trim().toLowerCase(), c.id]),
  );

  let skipped = 0;
  const seen = new Set<string>();
  const rows: Record<string, unknown>[] = [];

  for (const record of records) {
    const name = (record[mapping.full_name] ?? "").trim();
    const phone = (record[mapping.phone] ?? "").trim();
    const digits = last10(phone);

    // A row without a name or a usable number is not a lead.
    if (name.length < 2 || digits.length < 10) {
      skipped++;
      continue;
    }
    // Duplicates inside the same file, before touching the database.
    if (seen.has(digits)) {
      skipped++;
      continue;
    }
    seen.add(digits);

    const courseName = mapping.course ? (record[mapping.course] ?? "").trim() : "";
    const notes = mapping.notes ? (record[mapping.notes] ?? "").trim() : "";

    rows.push({
      full_name: name,
      phone,
      email: mapping.email ? (record[mapping.email] || null) : null,
      city: mapping.city ? (record[mapping.city] || null) : null,
      state: mapping.state ? (record[mapping.state] || null) : null,
      course_id: courseName ? (courseByName.get(courseName.toLowerCase()) ?? null) : null,
      source: parsed.data.source,
      status: "new",
      import_batch_id: batchId,
      created_by: staff.id,
      assigned_to: parsed.data.assign_to_me === "on" ? staff.id : null,
      assigned_at: parsed.data.assign_to_me === "on" ? new Date().toISOString() : null,
      metadata: notes ? { import_notes: notes, import_batch: batchId } : { import_batch: batchId },
    });
  }

  if (rows.length === 0) {
    return { ok: false, error: `Nothing importable — ${skipped} rows had no name or no valid 10-digit number.` };
  }

  // Skip numbers already in the CRM, so re-importing a corrected file does not
  // create a second copy of everyone.
  //
  // Chunked because PostgREST puts `in.(...)` in the query string: 2,000
  // numbers is a ~22 kB URL, which the server rejects. The failure mode is what
  // makes this matter — an errored lookup yields no rows, every number then
  // looks new, and the screen cheerfully reports "0 duplicates" while inserting
  // the whole file a second time. So the error is returned, never swallowed.
  const known = new Set<string>();
  const numbers = [...seen];
  for (let i = 0; i < numbers.length; i += LOOKUP_CHUNK) {
    const { data, error } = await crm
      .from("leads")
      .select("phone_last10")
      .in("phone_last10", numbers.slice(i, i + LOOKUP_CHUNK));

    if (error) {
      return { ok: false, error: `Could not check for duplicates: ${error.message}` };
    }
    for (const row of data ?? []) if (row.phone_last10) known.add(row.phone_last10);
  }

  const fresh = rows.filter((row) => !known.has(last10(String(row.phone))));
  const duplicates = rows.length - fresh.length;

  if (fresh.length === 0) {
    return { ok: false, error: `All ${duplicates} numbers are already in the CRM.` };
  }

  // The service role here is deliberate and narrow: the batch insert, with
  // `created_by` already stamped above so ownership is not lost.
  const admin = createCrmAdminClient();
  for (let i = 0; i < fresh.length; i += INSERT_CHUNK) {
    const { error } = await admin.from("leads").insert(fresh.slice(i, i + INSERT_CHUNK));
    if (error) {
      // Earlier chunks are already committed. They all carry `import_batch_id`,
      // so a partial import is identifiable and re-running the same file skips
      // what landed rather than duplicating it.
      return {
        ok: false,
        error: `Imported ${i} of ${fresh.length} before failing: ${error.message}. Re-run the same file to finish — rows already in will be skipped.`,
      };
    }
  }

  revalidatePath("/admin/crm/leads");
  revalidatePath("/admin/crm");

  return { ok: true, inserted: fresh.length, skipped, duplicates, batchId };
}
