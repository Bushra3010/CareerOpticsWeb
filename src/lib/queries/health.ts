import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database.types";

type TableName = keyof Database["public"]["Tables"];

/** Tables the anon role must be able to read for the public site to work. */
export const PUBLIC_TABLES = [
  "states",
  "cities",
  "streams",
  "courses",
  "colleges",
  "college_courses",
  "exams",
  "exam_courses",
  "testimonials",
  "faqs",
  "banners",
  "gallery",
  "press_releases",
  "scholarships",
] as const satisfies readonly TableName[];

export type TableCount = {
  table: (typeof PUBLIC_TABLES)[number];
  count: number | null;
  error: string | null;
};

/**
 * Row counts for every public table, read through the anon client so the
 * result also proves the RLS select policies are in place.
 */
export async function getPublicTableCounts(): Promise<TableCount[]> {
  const supabase = await createClient();

  return Promise.all(
    PUBLIC_TABLES.map(async (table) => {
      const { count, error } = await supabase
        .from(table)
        .select("*", { count: "exact", head: true });

      return { table, count, error: error?.message ?? null };
    }),
  );
}

/** A few seeded colleges with their city and state, to prove joins resolve. */
export async function getSampleColleges(limit = 5) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("colleges")
    .select(
      "id, name, slug, naac_grade, average_package, cities(name, states(name))",
    )
    .eq("status", "published")
    .order("nirf_rank", { ascending: true, nullsFirst: false })
    .limit(limit);

  if (error) throw new Error(error.message);
  return data;
}

/**
 * Confirms leads are NOT readable by anon. Returns true when the read is
 * correctly blocked (empty result or an explicit error).
 */
export async function leadsAreProtected(): Promise<boolean> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("leads").select("id").limit(1);
  return Boolean(error) || (data?.length ?? 0) === 0;
}
