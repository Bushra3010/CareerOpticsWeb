import { ADMISSION_FIELDS, ANSWER_LABELS, documentSlug, type AdmissionFieldDef } from "@/config/admission-form";
import { TEACHING_PROGRAMMES } from "@/config/teaching-programmes";
import { CATEGORY_OPTIONS } from "@/lib/validations/lead";

/**
 * The four admission tracks CareerOptics runs — one per CRM category
 * (`crm.leads.category`, 0031). Each has its own form fields and document
 * list; all of them share the photo slot, the UPI fee step and the
 * `metadata.answers` storage shape, so the CRM lead page shows every track the
 * same way.
 *
 * Pure config, no server imports: the CRM (client) and the public
 * `/apply/[code]` page both read it.
 */

export type TrackField = AdmissionFieldDef & {
  /** Hint shown under the input. */
  hint?: string;
  /** Only shown when another answer has one of these values. */
  showIf?: { key: string; values: readonly string[] };
};

export type TrackProgramme = {
  /** Stored as `admission_links.programme`; short, unique across tracks. */
  code: string;
  /** Stored as `answers.programme`; the heading on the form. */
  name: string;
  description: string;
  documents: string[];
  verification?: { label: string; options: string[] };
};

export type TrackSection = { title: string; fields: TrackField[] };

export type AdmissionTrack = {
  category: "credit_card" | "teacher_training" | "distance" | "open_school";
  label: string;
  /** One line on the track card. */
  blurb: string;
  programmes: TrackProgramme[];
  sections: TrackSection[];
  /** CRM course a programme maps to (`crm.courses.name`), when there is one. */
  crmCourse?: Record<string, string>;
};

const GENDER = ["Male", "Female", "Other"] as const;

/** Address block every track asks for. */
const ADDRESS: TrackField[] = [
  { key: "address_village", label: "Village / Mohalla" },
  { key: "address_post", label: "Post office" },
  { key: "address_block", label: "Block / Thana" },
  { key: "address_district", label: "District" },
  { key: "address_state", label: "State" },
  { key: "pincode", label: "PIN code", type: "tel" },
];

const PERSONAL: TrackField[] = [
  { key: "father_name", label: "Father's name" },
  { key: "mother_name", label: "Mother's name" },
  { key: "dob", label: "Date of birth", type: "date" },
  { key: "gender", label: "Gender", type: "select", options: GENDER },
  { key: "category", label: "Category", type: "select", options: CATEGORY_OPTIONS },
  { key: "parent_phone", label: "Parent's mobile", type: "tel" },
];

export const ADMISSION_TRACKS: AdmissionTrack[] = [
  {
    category: "credit_card",
    label: "Student Credit Card",
    blurb: "Bihar Student Credit Card (BSCC) loan for higher studies",
    programmes: [
      {
        code: "BSCC",
        name: "Bihar Student Credit Card",
        description:
          "Education loan up to ₹4 lakh under the Bihar Student Credit Card scheme, for students who passed 12th from Bihar.",
        documents: [
          "Aadhaar Card",
          "10th Marksheet",
          "12th Marksheet",
          "Residence Certificate",
          "Income Certificate",
          "Caste Certificate",
          "College Admission Letter",
          "Fee Structure",
          "Bank Passbook",
          "PAN Card",
          "Parent Aadhaar Card",
          "Signature",
        ],
      },
    ],
    sections: [
      { title: "Student details", fields: PERSONAL },
      { title: "Address", fields: ADDRESS },
      {
        title: "12th and course",
        fields: [
          { key: "twelfth_board", label: "12th board" },
          { key: "twelfth_year", label: "12th passing year", type: "tel" },
          { key: "twelfth_percent", label: "12th percentage" },
          { key: "college_name", label: "College for admission" },
          { key: "course_name", label: "Course" },
          { key: "course_duration", label: "Course duration (years)", type: "tel" },
          { key: "course_fee", label: "Total course fee (₹)", type: "tel" },
          { key: "loan_amount", label: "Loan amount needed (₹)", type: "tel" },
        ],
      },
      {
        title: "Family and bank",
        fields: [
          { key: "father_occupation", label: "Father's occupation" },
          {
            key: "family_income",
            label: "Family income (yearly)",
            type: "select",
            options: ["Below ₹1 lakh", "₹1–2.5 lakh", "₹2.5–4.5 lakh", "₹4.5–8 lakh", "Above ₹8 lakh"],
          },
          { key: "co_applicant", label: "Co-applicant (parent / guardian) name" },
          { key: "bank_name", label: "Bank name" },
          { key: "bank_branch", label: "Bank branch" },
        ],
      },
    ],
  },
  {
    category: "teacher_training",
    label: "B.Ed / D.El.Ed",
    blurb: "UP B.Ed and UP D.El.Ed admission",
    programmes: TEACHING_PROGRAMMES.map((p) => ({
      code: p.code,
      name: p.name,
      description: p.description,
      documents: p.documents,
      verification: p.verification,
    })),
    sections: [{ title: "Student details", fields: ADMISSION_FIELDS }],
    crmCourse: {
      "D.El.Ed": "Diploma in Elementary Education",
      "B.Ed": "Bachelor of Education",
    },
  },
  {
    category: "distance",
    label: "Distance Education",
    blurb: "UG and PG by distance / online mode",
    programmes: [
      {
        code: "Distance",
        name: "Distance Education",
        description:
          "Graduation and post-graduation by distance or online mode from a UGC-DEB approved university.",
        documents: [
          "10th Marksheet",
          "12th Marksheet",
          "Graduation Marksheet",
          "Aadhaar Card",
          "Migration Certificate",
          "Signature",
        ],
      },
    ],
    sections: [
      { title: "Student details", fields: PERSONAL },
      { title: "Address", fields: ADDRESS },
      {
        title: "Course",
        fields: [
          { key: "university", label: "University / college" },
          { key: "course_name", label: "Course", hint: "e.g. BA, B.Com, MBA, MA Hindi" },
          { key: "course_mode", label: "Mode", type: "select", options: ["Distance", "Online"] },
          { key: "session", label: "Session", hint: "e.g. 2025-26, July 2025" },
          { key: "last_qualification", label: "Last qualification", type: "select", options: ["12th", "Graduation", "Post Graduation", "Diploma"] },
          { key: "last_board", label: "Board / university of last exam" },
          { key: "last_year", label: "Passing year", type: "tel" },
          { key: "last_percent", label: "Percentage" },
        ],
      },
    ],
  },
  {
    category: "open_school",
    label: "NIOS / BBOSE",
    blurb: "10th and 12th through open schooling",
    programmes: [
      {
        code: "NIOS",
        name: "NIOS (10th / 12th)",
        description: "National Institute of Open Schooling — 10th (Secondary) and 12th (Senior Secondary).",
        documents: ["Previous Marksheet", "Aadhaar Card", "Birth Certificate", "Transfer Certificate", "Signature"],
      },
      {
        code: "BBOSE",
        name: "BBOSE (10th / 12th)",
        description: "Bihar Board of Open Schooling and Examination — 10th (Secondary) and 12th (Senior Secondary).",
        documents: ["Previous Marksheet", "Aadhaar Card", "Birth Certificate", "Transfer Certificate", "Signature"],
      },
    ],
    sections: [
      { title: "Student details", fields: PERSONAL },
      { title: "Address", fields: ADDRESS },
      {
        title: "Admission",
        fields: [
          { key: "class_applied", label: "Class", type: "select", options: ["10th", "12th"] },
          {
            key: "stream",
            label: "Stream",
            type: "select",
            options: ["Arts", "Science", "Commerce"],
            showIf: { key: "class_applied", values: ["12th"] },
          },
          {
            key: "admission_type",
            label: "Admission type",
            type: "select",
            options: ["Fresh", "Re-admission", "Part admission", "Transfer of credit (TOC)"],
          },
          { key: "subjects", label: "Subjects", hint: "e.g. Hindi, English, Maths, Science, Social Science" },
          { key: "medium", label: "Medium", type: "select", options: ["Hindi", "English", "Urdu"] },
          { key: "previous_school", label: "Previous school" },
          { key: "previous_board", label: "Previous board" },
          { key: "previous_class", label: "Last class passed", type: "select", options: ["8th", "9th", "10th", "11th", "12th (failed)"] },
          { key: "previous_year", label: "Passing year", type: "tel" },
        ],
      },
    ],
  },
];

export type TrackCategory = AdmissionTrack["category"];

export function getTrack(category: string | null | undefined): AdmissionTrack {
  return ADMISSION_TRACKS.find((t) => t.category === category) ?? ADMISSION_TRACKS[1];
}

/** Track and programme for an admission link's programme code. */
export function findProgramme(code: string): { track: AdmissionTrack; programme: TrackProgramme } | null {
  for (const track of ADMISSION_TRACKS) {
    const programme = track.programmes.find((p) => p.code === code);
    if (programme) return { track, programme };
  }
  return null;
}

export function trackFields(track: AdmissionTrack): TrackField[] {
  return track.sections.flatMap((s) => s.fields);
}

/** Every field key across every track → label, for the CRM's answer view. */
export const TRACK_FIELD_LABELS: Record<string, string> = Object.fromEntries(
  ADMISSION_TRACKS.flatMap((t) => trackFields(t).map((f) => [f.key, f.label])),
);

/** Every document across every track, for `fileLabel`. */
export const ALL_DOCUMENTS: string[] = Array.from(
  new Set(ADMISSION_TRACKS.flatMap((t) => t.programmes.flatMap((p) => p.documents))),
);

/** Label for any `answers` key a lead may carry, across all tracks. */
export const ALL_ANSWER_LABELS: Record<string, string> = {
  ...TRACK_FIELD_LABELS,
  ...ANSWER_LABELS,
  track: "Track",
};

/** Human label for an `answers.file_<slug>` key, across all tracks. */
export function documentLabel(key: string): string {
  const slug = key.replace(/^file_/, "");
  return ALL_DOCUMENTS.find((d) => documentSlug(d) === slug) ?? slug.replace(/_/g, " ");
}
