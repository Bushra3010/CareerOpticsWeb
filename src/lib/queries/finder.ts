import { createPublicClient } from "@/lib/supabase/public";

/**
 * Options the College Finder wizard offers (PRD §5.4).
 *
 * Fetched once on the server and handed to the client wizard, so stepping
 * through the six questions costs no round trips — the whole point on the 3G
 * Android traffic this is built for (§15).
 */
export async function getFinderOptions() {
  const supabase = createPublicClient();

  const [streams, courses, states, cities] = await Promise.all([
    supabase
      .from("streams")
      .select("name, slug, icon")
      .order("sort_order", { ascending: true, nullsFirst: false }),
    supabase
      .from("courses")
      .select("name, short_name, slug, level, streams(slug)")
      .eq("status", "published")
      .order("name", { ascending: true }),
    supabase.from("states").select("name, slug").order("name"),
    supabase.from("cities").select("name, slug, states(slug)").order("name"),
  ]);

  if (streams.error) throw new Error(`streams: ${streams.error.message}`);
  if (courses.error) throw new Error(`courses: ${courses.error.message}`);
  if (states.error) throw new Error(`states: ${states.error.message}`);
  if (cities.error) throw new Error(`cities: ${cities.error.message}`);

  return {
    streams: streams.data ?? [],
    courses: (courses.data ?? []).map((course) => ({
      name: course.short_name ?? course.name,
      slug: course.slug,
      level: course.level,
      stream: course.streams?.slug ?? null,
    })),
    states: states.data ?? [],
    cities: (cities.data ?? []).map((city) => ({
      name: city.name,
      slug: city.slug,
      state: city.states?.slug ?? null,
    })),
  };
}

export type FinderOptions = Awaited<ReturnType<typeof getFinderOptions>>;
export type FinderCourseOption = FinderOptions["courses"][number];
