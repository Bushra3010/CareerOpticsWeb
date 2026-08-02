import { createPublicClient } from "@/lib/supabase/public";
import type { Database } from "@/types/database.types";

/**
 * Taxonomy reads — PRD §4 routes `/courses`, `/streams`, `/exams`, `/city` and
 * the level hubs. All published public content behind the cookie-free anon
 * client, so every page here stays statically renderable under ISR.
 */

type LevelEnum = Database["public"]["Enums"]["level_enum"];

/** Shape the college grid components expect, shared by every taxonomy page. */
const COLLEGE_CARD_SELECT = `id, name, slug, short_name, type, naac_grade, nirf_rank,
  approvals, logo_url, cover_url, highest_package, average_package, rating,
  review_count, cities(name, slug, states(name))`;

/** Human labels for `level_enum`, used in headings and badges. */
export const LEVEL_LABELS: Record<string, string> = {
  after_10: "After 10th",
  after_12: "After 12th",
  ug: "Undergraduate",
  pg: "Postgraduate",
  diploma: "Diploma",
  doctorate: "Doctorate",
  certificate: "Certificate",
};

/**
 * The four level hubs (§4). A hub is phrased from where the student stands;
 * the enum describes the course, so one hub covers several enum values.
 */
export const LEVEL_HUBS = [
  {
    slug: "after-10th",
    title: "Courses After 10th",
    description:
      "Diploma and certificate routes you can start straight after Class 10, and where each one leads.",
    levels: ["after_10", "diploma", "certificate"],
  },
  {
    slug: "after-12th",
    title: "Courses After 12th",
    description:
      "Undergraduate degrees open to you after Class 12, with eligibility, fee ranges and career scope.",
    levels: ["after_12", "ug"],
  },
  {
    slug: "after-graduation",
    title: "Courses After Graduation",
    description:
      "Postgraduate programmes to take after a bachelor degree, with the entrance exams each one needs.",
    levels: ["pg"],
  },
  {
    slug: "after-pg",
    title: "Courses After Post Graduation",
    description:
      "Doctoral and research routes after a master degree.",
    levels: ["doctorate"],
  },
] as const;

export type LevelHub = (typeof LEVEL_HUBS)[number];

/** ───────────────────────────── streams ───────────────────────────── */

/**
 * Every stream with how many published courses and distinct colleges sit
 * behind it. The counts drive `/courses` and the stream hubs, so they are
 * computed once here rather than per page.
 */
export async function getStreamsWithCounts() {
  const supabase = createPublicClient();

  const [streams, courses, mappings] = await Promise.all([
    supabase
      .from("streams")
      .select("id, name, slug, icon, description")
      .order("sort_order", { ascending: true, nullsFirst: false }),
    supabase
      .from("courses")
      .select("id, stream_id")
      .eq("status", "published"),
    supabase
      .from("college_courses")
      .select("college_id, courses!inner(stream_id)"),
  ]);

  if (streams.error) throw new Error(`streams: ${streams.error.message}`);
  if (courses.error) throw new Error(`courses: ${courses.error.message}`);
  if (mappings.error)
    throw new Error(`college_courses: ${mappings.error.message}`);

  const collegesByStream = new Map<string, Set<string>>();
  for (const row of mappings.data ?? []) {
    const streamId = row.courses?.stream_id;
    if (!streamId || !row.college_id) continue;
    const set = collegesByStream.get(streamId) ?? new Set<string>();
    set.add(row.college_id);
    collegesByStream.set(streamId, set);
  }

  return (streams.data ?? []).map((stream) => ({
    ...stream,
    courseCount: (courses.data ?? []).filter((c) => c.stream_id === stream.id)
      .length,
    collegeCount: collegesByStream.get(stream.id)?.size ?? 0,
  }));
}

export type StreamWithCounts = Awaited<
  ReturnType<typeof getStreamsWithCounts>
>[number];

export async function getStreamBySlug(slug: string) {
  const supabase = createPublicClient();

  const { data, error } = await supabase
    .from("streams")
    .select("id, name, slug, icon, description")
    .eq("slug", slug)
    .maybeSingle();

  if (error) throw new Error(`stream ${slug}: ${error.message}`);
  return data;
}

export async function getStreamSlugs() {
  const supabase = createPublicClient();
  const { data, error } = await supabase.from("streams").select("slug");
  if (error) throw new Error(`streams: ${error.message}`);
  return (data ?? []).map((row) => row.slug);
}

/** ───────────────────────────── courses ───────────────────────────── */

const COURSE_SELECT =
  "id, name, short_name, slug, level, duration_months, eligibility, description, avg_fee_min, avg_fee_max, career_scope, is_featured, meta_title, meta_description, streams(id, name, slug, icon)";

export async function getCoursesByStream() {
  const supabase = createPublicClient();

  const { data, error } = await supabase
    .from("courses")
    .select(COURSE_SELECT)
    .eq("status", "published")
    .order("name", { ascending: true });

  if (error) throw new Error(`courses: ${error.message}`);
  return data ?? [];
}

export type CourseListItem = Awaited<
  ReturnType<typeof getCoursesByStream>
>[number];

export async function getCourseBySlug(slug: string) {
  const supabase = createPublicClient();

  const { data, error } = await supabase
    .from("courses")
    .select(COURSE_SELECT)
    .eq("slug", slug)
    .eq("status", "published")
    .maybeSingle();

  if (error) throw new Error(`course ${slug}: ${error.message}`);
  return data;
}

export type Course = NonNullable<Awaited<ReturnType<typeof getCourseBySlug>>>;

export async function getCourseSlugs() {
  const supabase = createPublicClient();
  const { data, error } = await supabase
    .from("courses")
    .select("slug")
    .eq("status", "published");
  if (error) throw new Error(`courses: ${error.message}`);
  return (data ?? []).map((row) => row.slug);
}

/** Courses in a stream, for the stream hub. */
export async function getCoursesInStream(streamId: string) {
  const supabase = createPublicClient();

  const { data, error } = await supabase
    .from("courses")
    .select(COURSE_SELECT)
    .eq("stream_id", streamId)
    .eq("status", "published")
    .order("name", { ascending: true });

  if (error) throw new Error(`courses: ${error.message}`);
  return data ?? [];
}

/** Courses at one of a hub's levels. */
export async function getCoursesAtLevels(levels: readonly string[]) {
  const supabase = createPublicClient();

  const { data, error } = await supabase
    .from("courses")
    .select(COURSE_SELECT)
    .eq("status", "published")
    .in("level", levels as LevelEnum[])
    .order("name", { ascending: true });

  if (error) throw new Error(`courses: ${error.message}`);
  return data ?? [];
}

/** ───────────────────────── colleges by taxonomy ───────────────────── */

/** Colleges that actually offer a given course, cheapest fee first. */
export async function getCollegesOfferingCourse(courseId: string, limit = 12) {
  const supabase = createPublicClient();

  const { data, error } = await supabase
    .from("college_courses")
    .select(`fee_per_year, colleges!inner(${COLLEGE_CARD_SELECT}, status)`)
    .eq("course_id", courseId)
    .eq("colleges.status", "published");

  if (error) throw new Error(`college_courses: ${error.message}`);

  return (data ?? [])
    .filter((row) => row.colleges)
    .sort((a, b) => {
      // Colleges without a published fee sort last, not as "free".
      if (a.fee_per_year == null && b.fee_per_year == null) return 0;
      if (a.fee_per_year == null) return 1;
      if (b.fee_per_year == null) return -1;
      return a.fee_per_year - b.fee_per_year;
    })
    .slice(0, limit)
    .map((row) => ({ ...row.colleges!, feePerYear: row.fee_per_year }));
}

/** Colleges offering any course in a stream. */
export async function getCollegesInStream(streamId: string, limit = 12) {
  const supabase = createPublicClient();

  const { data, error } = await supabase
    .from("college_courses")
    .select(
      `colleges!inner(${COLLEGE_CARD_SELECT}, status), courses!inner(stream_id)`,
    )
    .eq("courses.stream_id", streamId)
    .eq("colleges.status", "published");

  if (error) throw new Error(`college_courses: ${error.message}`);

  // One row per mapping, so the same college appears once per matching course.
  const seen = new Map<string, NonNullable<(typeof data)[number]["colleges"]>>();
  for (const row of data ?? []) {
    if (row.colleges && !seen.has(row.colleges.id)) {
      seen.set(row.colleges.id, row.colleges);
    }
  }

  return [...seen.values()]
    .sort((a, b) => Number(b.rating ?? 0) - Number(a.rating ?? 0))
    .slice(0, limit);
}

/** ───────────────────────────── cities ────────────────────────────── */

export async function getCityBySlug(slug: string) {
  const supabase = createPublicClient();

  const { data, error } = await supabase
    .from("cities")
    .select("id, name, slug, states(name, slug)")
    .eq("slug", slug)
    .maybeSingle();

  if (error) throw new Error(`city ${slug}: ${error.message}`);
  return data;
}

export async function getCollegesInCity(cityId: string) {
  const supabase = createPublicClient();

  const { data, error } = await supabase
    .from("colleges")
    .select(COLLEGE_CARD_SELECT)
    .eq("city_id", cityId)
    .eq("status", "published")
    .order("nirf_rank", { ascending: true, nullsFirst: false });

  if (error) throw new Error(`colleges: ${error.message}`);
  return data ?? [];
}

/**
 * Cities that have at least one published college — the only ones worth a
 * page. Prerendering all 120 would generate empty pages for most of them.
 */
export async function getCitySlugsWithColleges() {
  const supabase = createPublicClient();

  const { data, error } = await supabase
    .from("colleges")
    .select("cities!inner(slug)")
    .eq("status", "published");

  if (error) throw new Error(`colleges: ${error.message}`);
  return [...new Set((data ?? []).map((row) => row.cities?.slug).filter(Boolean))] as string[];
}

/** ───────────────────────────── exams ─────────────────────────────── */

const EXAM_SELECT =
  "id, name, slug, conducting_body, level, mode, exam_date, application_start, application_end, eligibility, pattern, syllabus, official_url, meta_title, meta_description";

export async function getExams() {
  const supabase = createPublicClient();

  const { data, error } = await supabase
    .from("exams")
    .select(EXAM_SELECT)
    .eq("status", "published")
    .order("exam_date", { ascending: true, nullsFirst: false });

  if (error) throw new Error(`exams: ${error.message}`);
  return data ?? [];
}

export type Exam = Awaited<ReturnType<typeof getExams>>[number];

export async function getExamBySlug(slug: string) {
  const supabase = createPublicClient();

  const { data, error } = await supabase
    .from("exams")
    .select(EXAM_SELECT)
    .eq("slug", slug)
    .eq("status", "published")
    .maybeSingle();

  if (error) throw new Error(`exam ${slug}: ${error.message}`);
  return data;
}

export async function getExamSlugs() {
  const supabase = createPublicClient();
  const { data, error } = await supabase
    .from("exams")
    .select("slug")
    .eq("status", "published");
  if (error) throw new Error(`exams: ${error.message}`);
  return (data ?? []).map((row) => row.slug);
}

/** Courses an exam is a gateway to, and the colleges that offer them. */
export async function getExamCourses(examId: string) {
  const supabase = createPublicClient();

  const { data, error } = await supabase
    .from("exam_courses")
    .select("courses!inner(id, name, short_name, slug, level, status)")
    .eq("exam_id", examId)
    .eq("courses.status", "published");

  if (error) throw new Error(`exam_courses: ${error.message}`);
  return (data ?? []).flatMap((row) => (row.courses ? [row.courses] : []));
}

/** Colleges accepting an exam, reached through the courses it feeds. */
export async function getCollegesAcceptingExam(courseIds: string[], limit = 8) {
  if (courseIds.length === 0) return [];

  const supabase = createPublicClient();
  const { data, error } = await supabase
    .from("college_courses")
    .select(`colleges!inner(${COLLEGE_CARD_SELECT}, status)`)
    .in("course_id", courseIds)
    .eq("colleges.status", "published");

  if (error) throw new Error(`college_courses: ${error.message}`);

  const seen = new Map<string, NonNullable<(typeof data)[number]["colleges"]>>();
  for (const row of data ?? []) {
    if (row.colleges && !seen.has(row.colleges.id)) {
      seen.set(row.colleges.id, row.colleges);
    }
  }

  return [...seen.values()]
    .sort((a, b) => Number(b.rating ?? 0) - Number(a.rating ?? 0))
    .slice(0, limit);
}

/** ───────────────────────────── guides ────────────────────────────── */

export async function getGuide(level: string, slug: string) {
  const supabase = createPublicClient();

  const { data, error } = await supabase
    .from("guides")
    .select("id, title, slug, level, content, cover_url, meta_title, meta_description")
    .eq("slug", slug)
    .eq("status", "published")
    .maybeSingle();

  if (error) throw new Error(`guide ${slug}: ${error.message}`);
  // The level lives in the URL for readability; a mismatched one is a 404
  // rather than a duplicate of the same article at two paths (§10 canonicals).
  if (!data || data.level !== level) return null;
  return data;
}

export async function getGuidesForLevel(level: string) {
  const supabase = createPublicClient();

  const { data, error } = await supabase
    .from("guides")
    .select("id, title, slug, level")
    .eq("status", "published")
    .eq("level", level as LevelEnum);

  if (error) throw new Error(`guides: ${error.message}`);
  return data ?? [];
}
