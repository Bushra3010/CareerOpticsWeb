import type { UploadBucket } from "@/config/storage";

/**
 * Editable fields per content section — PRD §5.5 CRUD.
 *
 * One declarative config drives the create form, the edit form and the server
 * action's validation, so adding a column means adding a line here rather than
 * writing another page.
 */
export type FieldKind =
  | "text"
  | "slug"
  | "textarea"
  | "richtext"
  | "number"
  | "date"
  | "select"
  | "boolean"
  | "image"
  | "list"; // comma-separated -> text[]

export type Field = {
  name: string;
  label: string;
  kind: FieldKind;
  required?: boolean;
  help?: string;
  placeholder?: string;
  /** `select` only. */
  options?: { value: string; label: string }[];
  /** `select` only — options loaded from a table at render time. */
  optionsFrom?: "colleges" | "courses" | "streams" | "cities";
  /** `image` only. */
  bucket?: UploadBucket;
};

const STATUS_FIELD: Field = {
  name: "status",
  label: "Status",
  kind: "select",
  options: [
    { value: "draft", label: "Draft — hidden from the site" },
    { value: "published", label: "Published — live" },
    { value: "archived", label: "Archived" },
  ],
};

const LEVEL_OPTIONS = [
  { value: "after_10", label: "After 10th" },
  { value: "after_12", label: "After 12th" },
  { value: "ug", label: "Undergraduate" },
  { value: "pg", label: "Postgraduate" },
  { value: "diploma", label: "Diploma" },
  { value: "doctorate", label: "Doctorate" },
  { value: "certificate", label: "Certificate" },
];

const SEO_FIELDS: Field[] = [
  {
    name: "meta_title",
    label: "Meta title",
    kind: "text",
    help: "Leave empty to use the templated default (§10).",
  },
  { name: "meta_description", label: "Meta description", kind: "textarea" },
];

/**
 * ⚠ The college metrics below are the ones flagged as invented demo data in
 * `seed.sql`. This form is how they get replaced with verified partner figures.
 */
export const SECTION_FIELDS: Record<string, Field[]> = {
  colleges: [
    { name: "name", label: "Name", kind: "text", required: true },
    {
      name: "slug",
      label: "Slug",
      kind: "slug",
      required: true,
      help: "Immutable once live — a rename needs a redirect in next.config.ts (§10).",
    },
    { name: "short_name", label: "Short name", kind: "text", placeholder: "IIT Patna" },
    { name: "city_id", label: "City", kind: "select", optionsFrom: "cities" },
    { name: "address", label: "Address", kind: "textarea" },
    {
      name: "type",
      label: "Type",
      kind: "select",
      options: ["private", "government", "deemed", "autonomous", "state", "central"].map(
        (v) => ({ value: v, label: v[0]!.toUpperCase() + v.slice(1) }),
      ),
    },
    { name: "established_year", label: "Established", kind: "number" },
    { name: "naac_grade", label: "NAAC grade", kind: "text", placeholder: "A++" },
    { name: "nirf_rank", label: "NIRF rank", kind: "number" },
    {
      name: "approvals",
      label: "Approvals",
      kind: "list",
      help: "Comma separated — UGC, AICTE, NBA, AIU…",
    },
    { name: "logo_url", label: "Logo", kind: "image", bucket: "colleges" },
    { name: "cover_url", label: "Cover image", kind: "image", bucket: "colleges" },
    { name: "highest_package", label: "Highest package (₹)", kind: "number" },
    { name: "average_package", label: "Average package (₹)", kind: "number" },
    { name: "total_students", label: "Total students", kind: "number" },
    { name: "campus_size", label: "Campus size", kind: "text", placeholder: "501 acres" },
    { name: "facilities", label: "Facilities", kind: "list", help: "Comma separated." },
    { name: "about", label: "About", kind: "richtext" },
    { name: "admission_process", label: "Admission process", kind: "richtext" },
    { name: "why_choose", label: "Why choose", kind: "richtext" },
    { name: "website", label: "Website", kind: "text", placeholder: "https://…" },
    { name: "is_featured", label: "Featured", kind: "boolean", help: "Shows on the home carousel and is prerendered." },
    STATUS_FIELD,
    ...SEO_FIELDS,
  ],

  courses: [
    { name: "name", label: "Name", kind: "text", required: true },
    { name: "short_name", label: "Short name", kind: "text", placeholder: "B.Tech" },
    { name: "slug", label: "Slug", kind: "slug", required: true },
    { name: "stream_id", label: "Stream", kind: "select", optionsFrom: "streams" },
    { name: "level", label: "Level", kind: "select", options: LEVEL_OPTIONS, required: true },
    { name: "duration_months", label: "Duration (months)", kind: "number" },
    { name: "eligibility", label: "Eligibility", kind: "textarea" },
    { name: "description", label: "Description", kind: "textarea" },
    { name: "avg_fee_min", label: "Fee from (₹/yr)", kind: "number" },
    { name: "avg_fee_max", label: "Fee to (₹/yr)", kind: "number" },
    { name: "career_scope", label: "Career scope", kind: "textarea" },
    { name: "is_featured", label: "Featured", kind: "boolean" },
    STATUS_FIELD,
    ...SEO_FIELDS,
  ],

  exams: [
    { name: "name", label: "Name", kind: "text", required: true },
    { name: "slug", label: "Slug", kind: "slug", required: true },
    { name: "conducting_body", label: "Conducting body", kind: "text" },
    { name: "level", label: "Level", kind: "select", options: LEVEL_OPTIONS },
    { name: "mode", label: "Mode", kind: "text", placeholder: "Computer based test" },
    { name: "exam_date", label: "Exam date", kind: "date" },
    { name: "application_start", label: "Applications open", kind: "date" },
    { name: "application_end", label: "Applications close", kind: "date" },
    { name: "eligibility", label: "Eligibility", kind: "textarea" },
    { name: "pattern", label: "Pattern", kind: "textarea" },
    { name: "syllabus", label: "Syllabus", kind: "textarea" },
    { name: "official_url", label: "Official website", kind: "text" },
    STATUS_FIELD,
    ...SEO_FIELDS,
  ],

  blogs: [
    { name: "title", label: "Title", kind: "text", required: true },
    { name: "slug", label: "Slug", kind: "slug", required: true },
    { name: "excerpt", label: "Excerpt", kind: "textarea", help: "Shown on the index card." },
    { name: "content", label: "Body", kind: "richtext", help: "## heading, - bullet, **bold**." },
    { name: "cover_url", label: "Cover image", kind: "image", bucket: "blogs" },
    { name: "category", label: "Category", kind: "text" },
    { name: "tags", label: "Tags", kind: "list" },
    { name: "author", label: "Author", kind: "text" },
    { name: "read_minutes", label: "Read time (min)", kind: "number" },
    { name: "published_at", label: "Publish date", kind: "date" },
    STATUS_FIELD,
    ...SEO_FIELDS,
  ],

  news: [
    { name: "title", label: "Title", kind: "text", required: true },
    { name: "slug", label: "Slug", kind: "slug", required: true },
    { name: "excerpt", label: "Excerpt", kind: "textarea" },
    { name: "content", label: "Body", kind: "richtext" },
    { name: "cover_url", label: "Cover image", kind: "image", bucket: "blogs" },
    { name: "category", label: "Category", kind: "text" },
    { name: "tags", label: "Tags", kind: "list" },
    { name: "author", label: "Author", kind: "text" },
    { name: "read_minutes", label: "Read time (min)", kind: "number" },
    { name: "published_at", label: "Publish date", kind: "date" },
    STATUS_FIELD,
    ...SEO_FIELDS,
  ],

  testimonials: [
    { name: "student_name", label: "Student name", kind: "text", required: true },
    { name: "photo_url", label: "Photo", kind: "image", bucket: "testimonials" },
    { name: "company", label: "Company", kind: "text" },
    { name: "package_lpa", label: "Package (LPA)", kind: "number" },
    { name: "course", label: "Course", kind: "text" },
    { name: "city", label: "City", kind: "text" },
    { name: "college_id", label: "College", kind: "select", optionsFrom: "colleges" },
    { name: "quote", label: "Quote", kind: "textarea", required: true },
    { name: "sort_order", label: "Order", kind: "number" },
    { name: "is_active", label: "Active", kind: "boolean" },
  ],

  gallery: [
    { name: "image_url", label: "Image", kind: "image", bucket: "gallery", required: true },
    { name: "caption", label: "Caption", kind: "text" },
    { name: "event_date", label: "Event date", kind: "date" },
    { name: "sort_order", label: "Order", kind: "number" },
  ],

  press: [
    { name: "publication", label: "Publication", kind: "text", required: true },
    { name: "image_url", label: "Logo", kind: "image", bucket: "press" },
    { name: "article_url", label: "Article URL", kind: "text" },
    { name: "published_on", label: "Published on", kind: "date" },
  ],

  banners: [
    { name: "title", label: "Headline", kind: "text", required: true, help: "Shown as the hero H1 on slide 1." },
    { name: "image_url", label: "Desktop image", kind: "image", bucket: "banners", help: "Wide — 1920×840 or similar." },
    { name: "image_mobile_url", label: "Mobile image", kind: "image", bucket: "banners", help: "Optional. Taller crop for phones." },
    { name: "cta_text", label: "Button text", kind: "text" },
    { name: "cta_url", label: "Button link", kind: "text", placeholder: "/college-finder" },
    { name: "sort_order", label: "Order", kind: "number" },
    { name: "is_active", label: "Active", kind: "boolean" },
  ],

  faqs: [
    { name: "question", label: "Question", kind: "text", required: true },
    { name: "answer", label: "Answer", kind: "textarea", required: true },
    {
      name: "scope",
      label: "Scope",
      kind: "select",
      options: [
        { value: "home", label: "Home page" },
        { value: "college", label: "A college page" },
      ],
    },
    { name: "ref_id", label: "College", kind: "select", optionsFrom: "colleges", help: "Only when scope is a college." },
    { name: "sort_order", label: "Order", kind: "number" },
  ],

  scholarships: [
    { name: "title", label: "Title", kind: "text", required: true },
    { name: "slug", label: "Slug", kind: "slug", required: true },
    { name: "state", label: "State", kind: "text" },
    { name: "content", label: "Body", kind: "richtext", help: "## heading, - bullet, **bold**." },
    { name: "image_url", label: "Image", kind: "image", bucket: "gallery" },
    STATUS_FIELD,
    ...SEO_FIELDS,
  ],
};

export function fieldsFor(section: string): Field[] {
  return SECTION_FIELDS[section] ?? [];
}
