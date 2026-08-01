import { createPublicClient } from "@/lib/supabase/public";

/**
 * Every read behind the home page (§5.1 items 4–16).
 *
 * All of it is published public content, so it goes through the cookie-free
 * anon client and stays statically renderable under the §10 ISR budget.
 * Pages never call Supabase inline (§13).
 */

/** 4. Hero carousel banners. */
export async function getHeroBanners() {
  const supabase = createPublicClient();

  const { data, error } = await supabase
    .from("banners")
    .select("id, title, image_url, image_mobile_url, cta_text, cta_url")
    .eq("is_active", true)
    .order("sort_order", { ascending: true, nullsFirst: false });

  if (error) throw new Error(`banners: ${error.message}`);
  return data ?? [];
}

export type HeroBanner = Awaited<ReturnType<typeof getHeroBanners>>[number];

/** 5. Study goal cards — one per featured stream, with its course shortlist. */
export async function getStudyGoals() {
  const supabase = createPublicClient();

  const [streams, courses, mappings] = await Promise.all([
    supabase
      .from("streams")
      .select("id, name, slug, icon, description")
      .eq("is_featured", true)
      .order("sort_order", { ascending: true, nullsFirst: false }),
    supabase
      .from("courses")
      .select("id, name, short_name, slug, stream_id, is_featured")
      .eq("status", "published"),
    // College counts per stream: 67 mapping rows, cheaper to group in JS than
    // to add a view for one section.
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
    collegeCount: collegesByStream.get(stream.id)?.size ?? 0,
    courses: (courses.data ?? [])
      .filter((course) => course.stream_id === stream.id)
      .sort(
        (a, b) => Number(b.is_featured ?? false) - Number(a.is_featured ?? false),
      )
      .slice(0, 4)
      .map((course) => ({
        name: course.short_name ?? course.name,
        slug: course.slug,
      })),
  }));
}

export type StudyGoal = Awaited<ReturnType<typeof getStudyGoals>>[number];

/**
 * 6. Quick stats strip.
 *
 * §5.1 asks for a "Students Guided" counter too. There is no verified figure
 * for it anywhere in the data, and inventing one on a lead-gen page is exactly
 * the trust problem flagged at the top of `seed.sql` — so the strip counts only
 * things the database actually knows. Add it back when a real number exists.
 */
export async function getSiteStats() {
  const supabase = createPublicClient();

  const publishedCount = async (table: "colleges" | "courses" | "exams") => {
    const { count, error } = await supabase
      .from(table)
      .select("id", { count: "exact", head: true })
      .eq("status", "published");
    if (error) throw new Error(`${table} count: ${error.message}`);
    return count ?? 0;
  };

  const cityCount = async () => {
    // `cities` has no status column — the whole table is public reference data.
    const { count, error } = await supabase
      .from("cities")
      .select("id", { count: "exact", head: true });
    if (error) throw new Error(`cities count: ${error.message}`);
    return count ?? 0;
  };

  const [colleges, courses, exams, cities] = await Promise.all([
    publishedCount("colleges"),
    publishedCount("courses"),
    publishedCount("exams"),
    cityCount(),
  ]);

  return { colleges, courses, exams, cities };
}

export type SiteStats = Awaited<ReturnType<typeof getSiteStats>>;

/** 7. Top Universities carousel. */
export async function getFeaturedColleges(limit = 12) {
  const supabase = createPublicClient();

  const { data, error } = await supabase
    .from("colleges")
    .select(
      `id, name, slug, short_name, type, naac_grade, nirf_rank, approvals,
       logo_url, cover_url, highest_package, average_package, rating,
       review_count, cities(name, states(name))`,
    )
    .eq("status", "published")
    .eq("is_featured", true)
    .order("nirf_rank", { ascending: true, nullsFirst: false })
    .limit(limit);

  if (error) throw new Error(`colleges: ${error.message}`);
  return data ?? [];
}

export type FeaturedCollege = Awaited<
  ReturnType<typeof getFeaturedColleges>
>[number];

/**
 * 9. Courses-by-level tabs. The level hubs are phrased from the student's
 * position ("After 12th"), the enum from the course's own level, so a hub maps
 * to one or more enum values.
 */
export const LEVEL_TABS = [
  {
    slug: "after-10th",
    label: "After 10th",
    href: "/after-10th",
    levels: ["after_10", "diploma", "certificate"],
  },
  {
    slug: "after-12th",
    label: "After 12th",
    href: "/after-12th",
    levels: ["after_12", "ug"],
  },
  {
    slug: "after-graduation",
    label: "After UG",
    href: "/after-graduation",
    levels: ["pg"],
  },
  {
    slug: "after-pg",
    label: "After PG",
    href: "/after-pg",
    levels: ["doctorate"],
  },
] as const;

export async function getCoursesByLevel() {
  const supabase = createPublicClient();

  const { data, error } = await supabase
    .from("courses")
    .select(
      "id, name, short_name, slug, level, career_scope, is_featured, streams(name, slug, icon)",
    )
    .eq("status", "published")
    .order("name", { ascending: true });

  if (error) throw new Error(`courses: ${error.message}`);
  const courses = data ?? [];

  return LEVEL_TABS.map((tab) => {
    const levels = tab.levels as readonly string[];
    const inTab = courses.filter((course) => levels.includes(course.level));

    // Career sub-tab: one entry per stream present at this level, described by
    // the career scope written on its most prominent course.
    const careers = new Map<
      string,
      { name: string; slug: string; icon: string | null; scope: string | null }
    >();
    for (const course of inTab) {
      const stream = course.streams;
      if (!stream?.slug || careers.has(stream.slug)) continue;
      careers.set(stream.slug, {
        name: stream.name,
        slug: stream.slug,
        icon: stream.icon,
        scope: course.career_scope,
      });
    }

    return {
      ...tab,
      courses: inTab
        .slice()
        .sort(
          (a, b) =>
            Number(b.is_featured ?? false) - Number(a.is_featured ?? false),
        )
        .slice(0, 12)
        .map((course) => ({
          name: course.short_name ?? course.name,
          slug: course.slug,
        })),
      careers: [...careers.values()],
    };
  }).filter((tab) => tab.courses.length > 0);
}

export type LevelTab = Awaited<ReturnType<typeof getCoursesByLevel>>[number];

/** 10. Top exams — the next ones on the calendar. */
export async function getUpcomingExams(limit = 8) {
  const supabase = createPublicClient();

  const today = new Date().toISOString().slice(0, 10);
  const { data, error } = await supabase
    .from("exams")
    .select("id, name, slug, conducting_body, level, mode, exam_date, application_end")
    .eq("status", "published")
    .gte("exam_date", today)
    .order("exam_date", { ascending: true })
    .limit(limit);

  if (error) throw new Error(`exams: ${error.message}`);

  // Every seeded exam date could be in the past on a future build — fall back
  // to the most recent set rather than rendering an empty section.
  if ((data ?? []).length > 0) return data ?? [];

  const fallback = await supabase
    .from("exams")
    .select("id, name, slug, conducting_body, level, mode, exam_date, application_end")
    .eq("status", "published")
    .order("exam_date", { ascending: false })
    .limit(limit);

  if (fallback.error) throw new Error(`exams: ${fallback.error.message}`);
  return fallback.data ?? [];
}

export type UpcomingExam = Awaited<ReturnType<typeof getUpcomingExams>>[number];

/** 11. Featured scholarship (Bihar Student Credit Card in the seed). */
export async function getFeaturedScholarship() {
  const supabase = createPublicClient();

  const { data, error } = await supabase
    .from("scholarships")
    .select("id, title, slug, state, content, image_url")
    .eq("status", "published")
    .order("title", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (error) throw new Error(`scholarships: ${error.message}`);
  return data;
}

export type FeaturedScholarship = Awaited<
  ReturnType<typeof getFeaturedScholarship>
>;

/** 12. Placements given by us. */
export async function getTestimonials() {
  const supabase = createPublicClient();

  const { data, error } = await supabase
    .from("testimonials")
    .select(
      "id, student_name, photo_url, company, package_lpa, course, city, quote, colleges(name, slug)",
    )
    .eq("is_active", true)
    .order("sort_order", { ascending: true, nullsFirst: false });

  if (error) throw new Error(`testimonials: ${error.message}`);
  return data ?? [];
}

export type Testimonial = Awaited<ReturnType<typeof getTestimonials>>[number];

/** 14. Gallery. */
export async function getGalleryItems(limit = 6) {
  const supabase = createPublicClient();

  const { data, error } = await supabase
    .from("gallery")
    .select("id, image_url, caption, event_date")
    .order("sort_order", { ascending: true, nullsFirst: false })
    .limit(limit);

  if (error) throw new Error(`gallery: ${error.message}`);
  return data ?? [];
}

export type GalleryItem = Awaited<ReturnType<typeof getGalleryItems>>[number];

/** 15. Press release strip. */
export async function getPressReleases() {
  const supabase = createPublicClient();

  const { data, error } = await supabase
    .from("press_releases")
    .select("id, publication, image_url, article_url, published_on")
    .order("published_on", { ascending: false, nullsFirst: false });

  if (error) throw new Error(`press_releases: ${error.message}`);
  return data ?? [];
}

export type PressRelease = Awaited<ReturnType<typeof getPressReleases>>[number];

/** 16. Home FAQs — also the source of the FAQPage JSON-LD. */
export async function getHomeFaqs() {
  const supabase = createPublicClient();

  const { data, error } = await supabase
    .from("faqs")
    .select("id, question, answer")
    .eq("scope", "home")
    .order("sort_order", { ascending: true, nullsFirst: false });

  if (error) throw new Error(`faqs: ${error.message}`);
  return data ?? [];
}

export type HomeFaq = Awaited<ReturnType<typeof getHomeFaqs>>[number];
