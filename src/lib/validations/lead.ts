import { z } from "zod";

/**
 * Shared lead schema — PRD §8. The same object validates the form in the
 * browser and the payload in `/api/leads`, so a client that skips validation
 * cannot write a row the form would have rejected.
 */

/** Sources the site can attribute a lead to (PRD §7 `leads.source`). */
export const LEAD_SOURCES = [
  "home_hero",
  "quick_enquiry",
  "college_detail",
  "college_finder",
  "brochure",
  "callback",
  "contact",
  "apply_now",
  /** The home page's D.El.Ed / B.Ed application (§5.3 Apply). */
  "teaching_admission",
] as const;

export type LeadSource = (typeof LEAD_SOURCES)[number];

/** Country codes offered by the phone field (§5.1 quick enquiry). */
export const COUNTRY_CODES = [
  { code: "+91", label: "India", flag: "🇮🇳" },
  { code: "+977", label: "Nepal", flag: "🇳🇵" },
  { code: "+880", label: "Bangladesh", flag: "🇧🇩" },
] as const;

/**
 * Every value `courses.level` can hold, so Apply can preselect the level of the
 * course a student clicked. The list used to stop at `diploma`, which left the
 * 8 published certificate and doctorate courses with no option to select — and
 * `leadFormSchema` derives its enum from here, so it would have rejected them.
 */
export const LEVEL_OPTIONS = [
  { value: "after_10", label: "After 10th" },
  { value: "after_12", label: "After 12th" },
  { value: "ug", label: "Undergraduate" },
  { value: "pg", label: "Postgraduate" },
  { value: "diploma", label: "Diploma" },
  { value: "doctorate", label: "Doctorate" },
  { value: "certificate", label: "Certificate" },
] as const;

/** Indian mobile, ten digits starting 6-9. `+91` is stripped client-side. */
const phone = z
  .string()
  .trim()
  .regex(/^[6-9]\d{9}$/, "Enter a 10-digit mobile number starting with 6-9");

/** Reservation categories used by Bihar/Indian admission forms. */
export const CATEGORY_OPTIONS = [
  "General",
  "EWS",
  "OBC",
  "EBC",
  "SC",
  "ST",
] as const;

/**
 * The counsellors' paper admission form, as fields (§5.3 "Apply").
 *
 * These are NOT columns on `leads` — they are folded into the existing
 * `answers` jsonb, which already carries the College Finder payload. That
 * keeps the whole thing migration-free and visible in the admin lead detail.
 *
 * Every one is optional on purpose. Name and mobile are all a student must
 * type to reach a counsellor; the rest is what the counsellor would otherwise
 * write down on the call, and making it mandatory would cost applications.
 */
export const admissionFormSchema = z.object({
  father_name: z.string().trim().max(60).optional().or(z.literal("")),
  dob: z.string().trim().max(10).optional().or(z.literal("")),
  parent_phone: z
    .union([
      z.string().trim().regex(/^[6-9]\d{9}$/, "Enter a 10-digit mobile number"),
      z.literal(""),
    ])
    .optional(),
  father_occupation: z.string().trim().max(60).optional().or(z.literal("")),
  address_village: z.string().trim().max(80).optional().or(z.literal("")),
  address_post: z.string().trim().max(80).optional().or(z.literal("")),
  address_district: z.string().trim().max(80).optional().or(z.literal("")),
  address_state: z.string().trim().max(80).optional().or(z.literal("")),
  student_class: z.string().trim().max(40).optional().or(z.literal("")),
  roll_code: z.string().trim().max(30).optional().or(z.literal("")),
  roll_no: z.string().trim().max(30).optional().or(z.literal("")),
  category: z
    .enum(CATEGORY_OPTIONS as unknown as [string, ...string[]])
    .optional()
    .or(z.literal("")),
  /**
   * Storage path in the private `applicant-photos` bucket, returned by
   * /api/upload/photo. Never a URL — the bucket has no public read.
   */
  photo_path: z.string().trim().max(200).optional().or(z.literal("")),
});

/** Keys folded into `answers` before the payload is posted. */
export const ADMISSION_KEYS = Object.keys(
  admissionFormSchema.shape,
) as (keyof z.infer<typeof admissionFormSchema>)[];

/**
 * The document checklist on the teacher-training application. Like the
 * admission fields these are not columns — `LeadForm` joins the ticked boxes
 * into `answers.documents_ready` before posting, so `/api/leads` is unchanged.
 *
 * Optional, deliberately: a student enquiring in August may not have their
 * graduation marksheet in hand yet, and gating the form on six checkboxes
 * would cost applications. Name and mobile stay the only required inputs.
 */
export const documentsFormSchema = z.object({
  documents: z.array(z.string().max(80)).max(20).optional(),
  verification_doc: z.string().trim().max(80).optional().or(z.literal("")),
  /**
   * Attached marksheets, keyed by the slug of the checklist entry they answer
   * (`10th_marksheet` → `2026/<uuid>.pdf`). Storage paths in the private
   * `applicant-documents` bucket, never URLs. Keyed rather than fixed columns
   * because the slots are derived from each programme's document list.
   */
  files: z.record(z.string().max(30), z.string().max(120)).optional(),
});

export const leadSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Enter your full name")
    .max(60, "Name is too long"),
  phone,
  email: z
    .union([z.email("Enter a valid email address"), z.literal("")])
    .optional(),
  country_code: z
    .enum(COUNTRY_CODES.map((c) => c.code) as [string, ...string[]])
    .default("+91"),
  city: z.string().trim().max(80).optional().or(z.literal("")),
  level: z.enum(LEVEL_OPTIONS.map((l) => l.value) as [string, ...string[]]).optional(),
  course_id: z.uuid().optional().or(z.literal("")),
  college_id: z.uuid().optional().or(z.literal("")),
  message: z.string().trim().max(1000).optional().or(z.literal("")),
  source: z.enum(LEAD_SOURCES),
  page_url: z.string().max(2048).optional().or(z.literal("")),
  utm_source: z.string().max(120).optional().or(z.literal("")),
  utm_medium: z.string().max(120).optional().or(z.literal("")),
  utm_campaign: z.string().max(120).optional().or(z.literal("")),
  utm_content: z.string().max(120).optional().or(z.literal("")),
  /**
   * Structured payload attached to the lead — the College Finder's six answers
   * (§5.4). Bounded to plain scalars so a client cannot post an arbitrary blob
   * into the column.
   */
  answers: z.record(z.string().max(40), z.string().max(200)).optional(),
  /**
   * Honeypot — bots fill it, humans never see it. Must stay empty.
   *
   * §8 writes this as `z.string().max(0)`, but rejecting it here returns a
   * field error naming `hp`, which tells a bot exactly which input is the
   * trap. The field is accepted instead and `/api/leads` drops a filled one
   * silently with a 200. Same rule, no signal back to the bot.
   */
  hp: z.string().optional(),
});

export type LeadInput = z.input<typeof leadSchema>;
export type LeadPayload = z.output<typeof leadSchema>;

/** Field set the visitor actually types, used as the form's resolver. */
export const leadFormSchema = leadSchema
  .omit({
    source: true,
    page_url: true,
    utm_source: true,
    utm_medium: true,
    utm_campaign: true,
    utm_content: true,
  })
  // Admission fields and the document checklist live on the form only —
  // `/api/leads` receives them inside `answers`, so the API surface is
  // unchanged.
  .extend(admissionFormSchema.shape)
  .extend(documentsFormSchema.shape);

export type LeadFormValues = z.input<typeof leadFormSchema>;
