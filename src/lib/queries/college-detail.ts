import { createPublicClient } from "@/lib/supabase/public";

/**
 * `/colleges/[slug]` reads — PRD §5.3.
 *
 * Everything here is published public content behind the cookie-free anon
 * client, so the page stays statically renderable under ISR.
 */

/** The college itself. Returns null for an unknown or unpublished slug. */
export async function getCollegeBySlug(slug: string) {
  const supabase = createPublicClient();

  const { data, error } = await supabase
    .from("colleges")
    .select(
      `id, name, slug, short_name, address, type, established_year, naac_grade,
       nirf_rank, approvals, logo_url, cover_url, brochure_url, highest_package,
       average_package, total_students, campus_size, facilities, about,
       admission_process, why_choose, rating, review_count, lat, lng, website,
       meta_title, meta_description, city_id,
       cities(name, slug, states(name, slug))`,
    )
    .eq("slug", slug)
    .eq("status", "published")
    .maybeSingle();

  if (error) throw new Error(`college ${slug}: ${error.message}`);
  return data;
}

export type College = NonNullable<Awaited<ReturnType<typeof getCollegeBySlug>>>;

/** §5.3 Courses & Fees table. */
export async function getCollegeCourses(collegeId: string) {
  const supabase = createPublicClient();

  const { data, error } = await supabase
    .from("college_courses")
    .select(
      `id, fee_per_year, total_fee, duration_months, seats, eligibility,
       courses(id, name, short_name, slug, level, eligibility, duration_months)`,
    )
    .eq("college_id", collegeId);

  if (error) throw new Error(`college_courses: ${error.message}`);

  return (data ?? [])
    .filter((row) => row.courses)
    .map((row) => ({
      id: row.id,
      courseId: row.courses!.id,
      name: row.courses!.short_name ?? row.courses!.name,
      fullName: row.courses!.name,
      slug: row.courses!.slug,
      level: row.courses!.level,
      // The mapping row overrides the course default where it has one.
      durationMonths: row.duration_months ?? row.courses!.duration_months,
      eligibility: row.eligibility ?? row.courses!.eligibility,
      feePerYear: row.fee_per_year,
      totalFee: row.total_fee,
      seats: row.seats,
    }))
    .sort((a, b) => a.name.localeCompare(b.name));
}

export type CollegeCourse = Awaited<
  ReturnType<typeof getCollegeCourses>
>[number];

export async function getCollegeGallery(collegeId: string) {
  const supabase = createPublicClient();

  const { data, error } = await supabase
    .from("college_gallery")
    .select("id, image_url, caption")
    .eq("college_id", collegeId)
    .order("sort_order", { ascending: true, nullsFirst: false });

  if (error) throw new Error(`college_gallery: ${error.message}`);
  return data ?? [];
}

export type CollegeGalleryItem = Awaited<
  ReturnType<typeof getCollegeGallery>
>[number];

/** §5.3 — approved reviews only. RLS enforces this too; the filter is explicit. */
export async function getApprovedReviews(collegeId: string) {
  const supabase = createPublicClient();

  const { data, error } = await supabase
    .from("reviews")
    .select("id, name, course, rating, title, body, created_at")
    .eq("college_id", collegeId)
    .eq("is_approved", true)
    .order("created_at", { ascending: false });

  if (error) throw new Error(`reviews: ${error.message}`);
  return data ?? [];
}

export type CollegeReview = Awaited<
  ReturnType<typeof getApprovedReviews>
>[number];

/** FAQs scoped to this college, falling back to nothing rather than the home set. */
export async function getCollegeFaqs(collegeId: string) {
  const supabase = createPublicClient();

  const { data, error } = await supabase
    .from("faqs")
    .select("id, question, answer")
    .eq("scope", "college")
    .eq("ref_id", collegeId)
    .order("sort_order", { ascending: true, nullsFirst: false });

  if (error) throw new Error(`faqs: ${error.message}`);
  return data ?? [];
}

/**
 * Right-rail "similar colleges" — same city first, then the same state, so a
 * student comparing options stays in a commutable radius.
 */
export async function getSimilarColleges(
  college: { id: string; city_id: string | null },
  stateSlug: string | null,
  limit = 4,
) {
  const supabase = createPublicClient();

  const select =
    "id, name, slug, short_name, naac_grade, rating, review_count, cities!inner(name, slug, states!inner(slug))";

  const sameCity = college.city_id
    ? await supabase
        .from("colleges")
        .select(select)
        .eq("status", "published")
        .eq("city_id", college.city_id)
        .neq("id", college.id)
        .limit(limit)
    : { data: [], error: null };

  if (sameCity.error) throw new Error(`similar: ${sameCity.error.message}`);
  const results = sameCity.data ?? [];
  if (results.length >= limit || !stateSlug) return results.slice(0, limit);

  const exclude = [college.id, ...results.map((row) => row.id)];
  const sameState = await supabase
    .from("colleges")
    .select(select)
    .eq("status", "published")
    .eq("cities.states.slug", stateSlug)
    .not("id", "in", `(${exclude.join(",")})`)
    .limit(limit - results.length);

  if (sameState.error) throw new Error(`similar: ${sameState.error.message}`);
  return [...results, ...(sameState.data ?? [])].slice(0, limit);
}

export type SimilarCollege = Awaited<
  ReturnType<typeof getSimilarColleges>
>[number];

/**
 * Slugs pre-rendered at build time (§5.3). Only featured colleges — the rest
 * are generated on first request and then cached by ISR.
 */
export async function getFeaturedCollegeSlugs() {
  const supabase = createPublicClient();

  const { data, error } = await supabase
    .from("colleges")
    .select("slug")
    .eq("status", "published")
    .eq("is_featured", true);

  if (error) throw new Error(`colleges: ${error.message}`);
  return (data ?? []).map((row) => row.slug);
}
