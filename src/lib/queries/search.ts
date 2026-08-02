import { createPublicClient } from "@/lib/supabase/public";

/**
 * Global search — PRD §8 `/api/search`.
 *
 * `ilike '%q%'` rather than a `similarity()` call: the `gin_trgm_ops` indexes
 * from 0001 serve a contained LIKE pattern directly, and ranking by similarity
 * would need an RPC function, which means a migration we cannot apply to the
 * live project yet. Substring matching is also what a student typing "b.tech"
 * or "patna" actually expects.
 */

export const SEARCH_LIMIT = 8;
/** Below this a substring match returns most of the catalogue, not an answer. */
export const MIN_QUERY_LENGTH = 2;

/** PostgREST treats `%`, `,` and `*` as syntax inside an `or=` filter. */
function escapePattern(query: string) {
  return query.replace(/[%_,()*\\]/g, " ").trim();
}

export type SearchResults = Awaited<ReturnType<typeof search>>;

export async function search(rawQuery: string) {
  const query = escapePattern(rawQuery).slice(0, 80);

  if (query.length < MIN_QUERY_LENGTH) {
    return { query: rawQuery, colleges: [], courses: [], exams: [], total: 0 };
  }

  const supabase = createPublicClient();
  const pattern = `*${query}*`;

  const [colleges, courses, exams] = await Promise.all([
    supabase
      .from("colleges")
      .select("id, name, slug, short_name, naac_grade, cities(name, states(name))")
      .eq("status", "published")
      .or(`name.ilike.${pattern},short_name.ilike.${pattern}`)
      .limit(SEARCH_LIMIT),
    supabase
      .from("courses")
      .select("id, name, slug, short_name, level, streams(name)")
      .eq("status", "published")
      .or(`name.ilike.${pattern},short_name.ilike.${pattern}`)
      .limit(SEARCH_LIMIT),
    supabase
      .from("exams")
      .select("id, name, slug, conducting_body, exam_date")
      .eq("status", "published")
      .or(`name.ilike.${pattern},conducting_body.ilike.${pattern}`)
      .limit(SEARCH_LIMIT),
  ]);

  if (colleges.error) throw new Error(`colleges: ${colleges.error.message}`);
  if (courses.error) throw new Error(`courses: ${courses.error.message}`);
  if (exams.error) throw new Error(`exams: ${exams.error.message}`);

  const results = {
    query: rawQuery,
    colleges: colleges.data ?? [],
    courses: courses.data ?? [],
    exams: exams.data ?? [],
  };

  return {
    ...results,
    total: results.colleges.length + results.courses.length + results.exams.length,
  };
}
