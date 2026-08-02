/**
 * Content sections managed from `/admin` — PRD §5.5.
 *
 * Each entry says which table it maps to, what a row is called, which column
 * controls visibility, and which columns to show in the list. One config drives
 * one shared list + visibility-toggle screen instead of eleven near-identical
 * pages.
 *
 * The editable columns for each section live in `config/admin-fields.ts`,
 * which drives the create and edit forms and the server action's validation.
 */

export type VisibilityKind =
  /** `content_status` enum: draft | published | archived */
  | "status"
  /** boolean `is_active` */
  | "is_active";

export type ContentSection = {
  slug: string;
  table: ContentTable;
  title: string;
  description: string;
  /** Column rendered as the row's name. */
  titleColumn: string;
  /** Extra columns shown after the title. */
  columns: { key: string; label: string }[];
  visibility: VisibilityKind | null;
  /** Column to order by, descending unless `ascending`. */
  orderBy: string;
  ascending?: boolean;
  /** Public URL pattern, when the row has one. */
  publicPath?: (row: Record<string, unknown>) => string | null;
};

export const CONTENT_TABLES = [
  "colleges",
  "courses",
  "exams",
  "blogs",
  "news",
  "testimonials",
  "gallery",
  "press_releases",
  "banners",
  "faqs",
  "scholarships",
] as const;

export type ContentTable = (typeof CONTENT_TABLES)[number];

export const CONTENT_SECTIONS: ContentSection[] = [
  {
    slug: "colleges",
    table: "colleges",
    title: "Colleges",
    description:
      "Full details, images, packages and publish state for every college.",
    titleColumn: "name",
    columns: [
      { key: "naac_grade", label: "NAAC" },
      { key: "nirf_rank", label: "NIRF" },
      { key: "rating", label: "Rating" },
    ],
    visibility: "status",
    orderBy: "name",
    ascending: true,
    publicPath: (row) => (row.slug ? `/colleges/${row.slug}` : null),
  },
  {
    slug: "courses",
    table: "courses",
    title: "Courses",
    description: "Course catalogue used by the finder, filters and taxonomy pages.",
    titleColumn: "name",
    columns: [
      { key: "short_name", label: "Short name" },
      { key: "level", label: "Level" },
    ],
    visibility: "status",
    orderBy: "name",
    ascending: true,
    publicPath: (row) => (row.slug ? `/courses/${row.slug}` : null),
  },
  {
    slug: "exams",
    table: "exams",
    title: "Exams",
    description: "Entrance exams, their dates and application windows.",
    titleColumn: "name",
    columns: [
      { key: "conducting_body", label: "Body" },
      { key: "exam_date", label: "Exam date" },
    ],
    visibility: "status",
    orderBy: "exam_date",
    publicPath: (row) => (row.slug ? `/exams/${row.slug}` : null),
  },
  {
    slug: "blogs",
    table: "blogs",
    title: "Blogs",
    description: "Admission guides and course comparisons.",
    titleColumn: "title",
    columns: [
      { key: "category", label: "Category" },
      { key: "published_at", label: "Published" },
    ],
    visibility: "status",
    orderBy: "published_at",
    publicPath: (row) => (row.slug ? `/blogs/${row.slug}` : null),
  },
  {
    slug: "news",
    table: "news",
    title: "News",
    description: "Admission notifications and exam date changes.",
    titleColumn: "title",
    columns: [
      { key: "category", label: "Category" },
      { key: "published_at", label: "Published" },
    ],
    visibility: "status",
    orderBy: "published_at",
    publicPath: (row) => (row.slug ? `/news/${row.slug}` : null),
  },
  {
    slug: "testimonials",
    table: "testimonials",
    title: "Testimonials",
    description: "Student placement stories shown on the home page and /placements.",
    titleColumn: "student_name",
    columns: [
      { key: "company", label: "Company" },
      { key: "package_lpa", label: "Package (LPA)" },
    ],
    visibility: "is_active",
    orderBy: "sort_order",
    ascending: true,
  },
  {
    slug: "gallery",
    table: "gallery",
    title: "Gallery",
    description: "Camp and campus-visit photos.",
    titleColumn: "caption",
    columns: [{ key: "event_date", label: "Event date" }],
    visibility: null,
    orderBy: "sort_order",
    ascending: true,
  },
  {
    slug: "press",
    table: "press_releases",
    title: "Press",
    description: "Publications that have covered us.",
    titleColumn: "publication",
    columns: [{ key: "published_on", label: "Published" }],
    visibility: null,
    orderBy: "published_on",
  },
  {
    slug: "banners",
    table: "banners",
    title: "Banners",
    description: "Home hero slides.",
    titleColumn: "title",
    columns: [
      { key: "cta_text", label: "CTA" },
      { key: "sort_order", label: "Order" },
    ],
    visibility: "is_active",
    orderBy: "sort_order",
    ascending: true,
  },
  {
    slug: "faqs",
    table: "faqs",
    title: "FAQs",
    description: "Questions shown on the home page and college pages.",
    titleColumn: "question",
    columns: [
      { key: "scope", label: "Scope" },
      { key: "sort_order", label: "Order" },
    ],
    visibility: null,
    orderBy: "sort_order",
    ascending: true,
  },
  {
    slug: "scholarships",
    table: "scholarships",
    title: "Scholarships",
    description: "Government schemes and education loan guides.",
    titleColumn: "title",
    columns: [{ key: "state", label: "State" }],
    visibility: "status",
    orderBy: "title",
    ascending: true,
    publicPath: (row) => (row.slug ? `/scholarships/${row.slug}` : null),
  },
];

export function findSection(slug: string) {
  return CONTENT_SECTIONS.find((section) => section.slug === slug) ?? null;
}
