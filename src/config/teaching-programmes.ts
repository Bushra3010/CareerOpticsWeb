/**
 * The two UP teacher-training programmes promoted between the hero and the
 * study goals on the home page.
 *
 * In `config/` rather than `lib/queries/`: the Apply dialog is a client
 * component, and importing this from a query module would drag
 * `lib/supabase/server.ts` — and therefore `next/headers` — into the browser
 * bundle. Same reason `config/leads.ts` exists.
 *
 * The document lists are the counsellors' intake checklists, not catalogue
 * data: they change with the state's admission notification rather than with
 * the `courses` table, so they are not worth a column. `courseSlug` points at
 * the real published course row that "About" links to.
 */
export type TeachingProgramme = {
  /** Short code in the badge and in every button label. */
  code: string;
  /** Card heading and lead-dialog title. */
  name: string;
  description: string;
  /** `courses.slug` — the published course page "About" links to. */
  courseSlug: string;
  /** Preselects `leads.level` without showing the "Course type" select. */
  level: string;
  /** Documents the applicant needs; ticked ones travel in `answers`. */
  documents: string[];
  /** Single-choice group, e.g. D.El.Ed's ID proof for verification. */
  verification?: { label: string; options: string[] };
};

export const TEACHING_PROGRAMMES: TeachingProgramme[] = [
  {
    code: "D.El.Ed",
    name: "UP D.El.Ed",
    description:
      "Two-year diploma for primary school teaching in Uttar Pradesh. Merit is built from your 10th, 12th and graduation marks.",
    courseSlug: "d-el-ed",
    level: "diploma",
    documents: [
      "10th Marksheet",
      "12th Marksheet",
      "Graduation Marksheet",
      "Aadhaar Card",
      "Signature",
      "Passport Size Photo",
    ],
    verification: {
      label: "Any one, for document verification",
      options: [
        "Voter ID Card",
        "PAN Card",
        "Bank Passbook with Photo",
        "Ration Card",
        "Driving Licence",
      ],
    },
  },
  {
    code: "B.Ed",
    name: "UP B.Ed",
    description:
      "Two-year degree for teaching upper primary and secondary classes in Uttar Pradesh. Open to graduates, with online registration.",
    courseSlug: "b-ed",
    level: "pg",
    documents: [
      "10th Marksheet",
      "12th Marksheet",
      "Graduation Marksheet",
      "Aadhaar Card",
      "Photo",
      "Signature",
      "Fingerprint for online registration",
    ],
  },
];
