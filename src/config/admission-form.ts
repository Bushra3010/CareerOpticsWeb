import { TEACHING_PROGRAMMES } from "@/config/teaching-programmes";
import { CATEGORY_OPTIONS } from "@/lib/validations/lead";

/**
 * The B.Ed / D.El.Ed admission form, as one field list shared by the website
 * form, the public admission link and the CRM's "punch an admission" screen —
 * all three write the same keys into `answers` (website) or
 * `crm.leads.metadata.answers` (CRM), so the CRM shows them the same way.
 *
 * Pure config, no server imports: client components use it.
 */
export type AdmissionFieldDef = {
  key: string;
  label: string;
  type?: "text" | "date" | "tel" | "select";
  options?: readonly string[];
};

export const ADMISSION_FIELDS: AdmissionFieldDef[] = [
  { key: "father_name", label: "Father's name" },
  { key: "father_occupation", label: "Father's occupation" },
  { key: "dob", label: "Date of birth", type: "date" },
  { key: "parent_phone", label: "Parent's mobile", type: "tel" },
  { key: "category", label: "Category", type: "select", options: CATEGORY_OPTIONS },
  { key: "address_village", label: "Village / Mohalla" },
  { key: "address_post", label: "Post office" },
  { key: "address_district", label: "District" },
  { key: "address_state", label: "State" },
  { key: "student_class", label: "Qualification / class" },
  { key: "roll_code", label: "Roll code" },
  { key: "roll_no", label: "Roll no." },
];

/** Labels for every `answers` key the CRM may show. */
export const ANSWER_LABELS: Record<string, string> = {
  programme: "Programme",
  documents_ready: "Documents ready",
  verification_doc: "Verification document",
  ref: "Form link",
  ...Object.fromEntries(ADMISSION_FIELDS.map((f) => [f.key, f.label])),
};

export const PROGRAMMES = TEACHING_PROGRAMMES;

/** `crm.courses.name` each programme maps to, so a punched admission gets a course. */
export const PROGRAMME_CRM_COURSE: Record<string, string> = {
  "D.El.Ed": "Diploma in Elementary Education",
  "B.Ed": "Bachelor of Education",
};

/** "10th Marksheet" → "10th_marksheet" — same slug the website form uses. */
export function documentSlug(label: string): string {
  return label
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_|_$/g, "")
    .slice(0, 30);
}

/** Human label for an `answers.file_<slug>` key. */
export function fileLabel(key: string): string {
  const slug = key.replace(/^file_/, "");
  for (const p of TEACHING_PROGRAMMES) {
    const hit = p.documents.find((d) => documentSlug(d) === slug);
    if (hit) return hit;
  }
  return slug.replace(/_/g, " ");
}
