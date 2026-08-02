import {
  COLLEGE_TYPES,
  MAX_COMPARE,
  OWNERSHIP,
  PAGE_SIZE,
  type SortValue,
} from "@/config/filters";
import { createPublicClient } from "@/lib/supabase/public";
import type { CollegeFilters } from "@/lib/search-params/colleges";
import type { Database } from "@/types/database.types";

/**
 * `/colleges` listing reads — PRD §5.2.
 *
 * ## Why this runs in two queries
 *
 * "Fee: Low to High" sorts on the cheapest `college_courses.fee_per_year` for
 * each college, which is a child aggregate PostgREST cannot order a parent by.
 * So the first query fetches a **narrow** row per matching college (sort keys
 * plus its course fees), sorting and paging happen here, and the second query
 * fetches full rows for just the 24 ids on the page.
 *
 * That keeps one code path for every sort. It does mean the first query reads
 * every matching college: fine at the current catalogue size, and capped at
 * `MAX_LISTING_ROWS` so growth surfaces as a flag rather than silent
 * truncation. Move the fee aggregate into a database view before the catalogue
 * passes that mark.
 */

/** Ceiling on the narrow first query. Reaching it is reported, never silent. */
export const MAX_LISTING_ROWS = 500;

type NarrowRow = {
  id: string;
  rating: number | null;
  nirf_rank: number | null;
  is_featured: boolean | null;
  review_count: number | null;
  college_courses: { fee_per_year: number | null }[] | null;
};

function minFeeOf(row: NarrowRow): number | null {
  const fees = (row.college_courses ?? [])
    .map((course) => course.fee_per_year)
    .filter((fee): fee is number => typeof fee === "number" && fee > 0);
  return fees.length ? Math.min(...fees) : null;
}

type CollegeType = Database["public"]["Enums"]["college_type"];

const VALID_TYPES = new Set(COLLEGE_TYPES.map((option) => option.value));

/**
 * Resolves the type/ownership pair into enum values to filter on. Anything the
 * URL invented is dropped here — Postgres rejects an unknown enum member with
 * a 500, and a hand-edited query string should not be able to cause one.
 */
function resolveTypes(filters: CollegeFilters): CollegeType[] {
  const ownershipTypes =
    OWNERSHIP.find((o) => o.value === filters.ownership)?.types ?? null;

  const selected = filters.type.filter((type) => VALID_TYPES.has(type));

  const resolved =
    selected.length && ownershipTypes
      ? selected.filter((type) => ownershipTypes.includes(type))
      : selected.length
        ? selected
        : (ownershipTypes ?? []);

  return resolved as CollegeType[];
}

export async function listColleges(filters: CollegeFilters) {
  const supabase = createPublicClient();

  const needsCourseJoin = Boolean(
    filters.stream || filters.course || filters.fee,
  );
  const needsCityJoin = Boolean(filters.state || filters.city);

  // The embeds are `!inner` only when something filters through them, so an
  // unfiltered listing still shows colleges with no course mapping or city.
  const courseEmbed = needsCourseJoin
    ? `college_courses!inner(fee_per_year, courses!inner(slug, streams!inner(slug)))`
    : `college_courses(fee_per_year)`;
  const cityEmbed = needsCityJoin ? `, cities!inner(slug, states!inner(slug))` : "";

  let narrow = supabase
    .from("colleges")
    .select(
      `id, rating, nirf_rank, is_featured, review_count, ${courseEmbed}${cityEmbed}`,
      { count: "exact" },
    )
    .eq("status", "published");

  if (filters.stream)
    narrow = narrow.eq("college_courses.courses.streams.slug", filters.stream);
  if (filters.course)
    narrow = narrow.eq("college_courses.courses.slug", filters.course);
  if (filters.fee)
    narrow = narrow.lte("college_courses.fee_per_year", filters.fee);
  if (filters.city) narrow = narrow.eq("cities.slug", filters.city);
  if (filters.state) narrow = narrow.eq("cities.states.slug", filters.state);

  const types = resolveTypes(filters);
  if (types.length) narrow = narrow.in("type", types);
  if (filters.naac.length) narrow = narrow.in("naac_grade", filters.naac);
  // Any-of, not all-of: a student ticking UGC and AICTE wants either.
  if (filters.approvals.length)
    narrow = narrow.overlaps("approvals", filters.approvals);
  if (filters.rating) narrow = narrow.gte("rating", filters.rating);

  const { data, error, count } = await narrow.limit(MAX_LISTING_ROWS);
  if (error) throw new Error(`colleges: ${error.message}`);

  const rows = (data ?? []) as unknown as NarrowRow[];
  const total = count ?? rows.length;
  const truncated = total > MAX_LISTING_ROWS;

  const sorted = sortRows(rows, filters.sort);
  const page = Math.max(1, filters.page);
  const pageIds = sorted
    .slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)
    .map((row) => row.id);

  const colleges = pageIds.length ? await getCollegesByIds(pageIds) : [];
  const feeById = new Map(rows.map((row) => [row.id, minFeeOf(row)]));

  return {
    colleges: colleges.map((college) => ({
      ...college,
      minFee: feeById.get(college.id) ?? null,
    })),
    total,
    page,
    pageCount: Math.max(1, Math.ceil(sorted.length / PAGE_SIZE)),
    truncated,
  };
}

export type CollegeListItem = Awaited<
  ReturnType<typeof listColleges>
>["colleges"][number];

function sortRows(rows: NarrowRow[], sort: SortValue): NarrowRow[] {
  const byFee = new Map(rows.map((row) => [row.id, minFeeOf(row)]));
  const copy = [...rows];

  switch (sort) {
    case "fee-asc":
      // Colleges with no mapped fee sort last rather than reading as free.
      return copy.sort((a, b) => {
        const feeA = byFee.get(a.id);
        const feeB = byFee.get(b.id);
        if (feeA == null && feeB == null) return 0;
        if (feeA == null) return 1;
        if (feeB == null) return -1;
        return feeA - feeB;
      });

    case "nirf":
      return copy.sort((a, b) => {
        if (a.nirf_rank == null && b.nirf_rank == null) return 0;
        if (a.nirf_rank == null) return 1;
        if (b.nirf_rank == null) return -1;
        return a.nirf_rank - b.nirf_rank;
      });

    case "rating":
      return copy.sort((a, b) => Number(b.rating ?? 0) - Number(a.rating ?? 0));

    case "popularity":
    default:
      // There is no popularity column. Editorially featured first, then the
      // best-reviewed — the closest honest proxy the schema supports.
      return copy.sort(
        (a, b) =>
          Number(b.is_featured ?? false) - Number(a.is_featured ?? false) ||
          (b.review_count ?? 0) - (a.review_count ?? 0) ||
          Number(b.rating ?? 0) - Number(a.rating ?? 0),
      );
  }
}

/** Full card rows for a set of ids, used by the listing page and `/compare`. */
export async function getCollegesByIds(ids: string[]) {
  if (ids.length === 0) return [];

  const supabase = createPublicClient();
  const { data, error } = await supabase
    .from("colleges")
    .select(
      `id, name, slug, short_name, type, established_year, naac_grade, nirf_rank,
       approvals, logo_url, cover_url, brochure_url, highest_package,
       average_package, total_students, campus_size, facilities, rating,
       review_count, cities(name, slug, states(name))`,
    )
    .eq("status", "published")
    .in("id", ids);

  if (error) throw new Error(`colleges: ${error.message}`);

  // `.in()` does not preserve the order of the ids, and that order is the sort.
  const byId = new Map((data ?? []).map((college) => [college.id, college]));
  return ids
    .map((id) => byId.get(id))
    .filter((college): college is NonNullable<typeof college> => Boolean(college));
}

export type CollegeDetailRow = Awaited<ReturnType<typeof getCollegesByIds>>[number];

/** `/compare` reads its ids straight from the query string, so cap them here. */
export async function getComparedColleges(ids: string[]) {
  const unique = [...new Set(ids.filter(Boolean))].slice(0, MAX_COMPARE);
  const colleges = await getCollegesByIds(unique);

  // Cheapest mapped fee per college, shown as the "Fee / year" row.
  const supabase = createPublicClient();
  const { data } = await supabase
    .from("college_courses")
    .select("college_id, fee_per_year")
    .in("college_id", unique);

  const fees = new Map<string, number>();
  for (const row of data ?? []) {
    if (!row.college_id || !row.fee_per_year) continue;
    const current = fees.get(row.college_id);
    if (current == null || row.fee_per_year < current) {
      fees.set(row.college_id, row.fee_per_year);
    }
  }

  return colleges.map((college) => ({
    ...college,
    minFee: fees.get(college.id) ?? null,
  }));
}

export type ComparedCollege = Awaited<
  ReturnType<typeof getComparedColleges>
>[number];

/** Streams, states, cities and courses offered by published colleges. */
export async function getFilterOptions() {
  const supabase = createPublicClient();

  const [streams, states, cities, courses] = await Promise.all([
    supabase.from("streams").select("name, slug").order("sort_order"),
    supabase.from("states").select("name, slug").order("name"),
    supabase
      .from("cities")
      .select("name, slug, states(slug)")
      .order("name"),
    supabase
      .from("courses")
      .select("name, short_name, slug")
      .eq("status", "published")
      .eq("is_featured", true)
      .order("name"),
  ]);

  if (streams.error) throw new Error(`streams: ${streams.error.message}`);
  if (states.error) throw new Error(`states: ${states.error.message}`);
  if (cities.error) throw new Error(`cities: ${cities.error.message}`);
  if (courses.error) throw new Error(`courses: ${courses.error.message}`);

  return {
    streams: streams.data ?? [],
    states: states.data ?? [],
    cities: (cities.data ?? []).map((city) => ({
      name: city.name,
      slug: city.slug,
      state: city.states?.slug ?? null,
    })),
    courses: (courses.data ?? []).map((course) => ({
      name: course.short_name ?? course.name,
      slug: course.slug,
    })),
  };
}

export type FilterOptions = Awaited<ReturnType<typeof getFilterOptions>>;
