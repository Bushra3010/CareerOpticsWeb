/**
 * Column model for the CRM's bulk lead import.
 *
 * Lives in `config/` rather than beside the server action because a
 * `"use server"` module may only export async functions — exporting the column
 * list from there fails the build, and the import UI is a client component that
 * must not pull `next/headers` in through the action file either.
 */

/** The columns the importer understands, and the header spellings it accepts. */
export const IMPORT_COLUMNS = [
  { key: "full_name", label: "Name", required: true, aliases: ["name", "full name", "student name", "candidate"] },
  { key: "phone", label: "Phone", required: true, aliases: ["phone", "mobile", "contact", "phone number", "mobile no"] },
  { key: "email", label: "Email", required: false, aliases: ["email", "email id", "e-mail"] },
  { key: "city", label: "City", required: false, aliases: ["city", "town"] },
  { key: "state", label: "State", required: false, aliases: ["state"] },
  { key: "course", label: "Course", required: false, aliases: ["course", "programme", "program"] },
  { key: "notes", label: "Notes", required: false, aliases: ["notes", "remark", "remarks", "comment"] },
] as const;

export type ImportColumnKey = (typeof IMPORT_COLUMNS)[number]["key"];

/** Best guess at which CSV header feeds which column, so the UI starts mapped. */
export function guessMapping(headers: string[]): Record<string, string> {
  const mapping: Record<string, string> = {};
  for (const column of IMPORT_COLUMNS) {
    const match = headers.find((header) => {
      const h = header.trim().toLowerCase();
      return h === column.key || (column.aliases as readonly string[]).includes(h);
    });
    if (match) mapping[column.key] = match;
  }
  return mapping;
}

export type ImportPreview = {
  ok: boolean;
  error?: string;
  headers?: string[];
  rows?: Record<string, string>[];
  mapping?: Record<string, string>;
  total?: number;
};

export type ImportResult = {
  ok: boolean;
  error?: string;
  inserted?: number;
  duplicates?: number;
  skipped?: number;
  batchId?: string;
};
