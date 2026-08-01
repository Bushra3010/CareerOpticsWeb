import { createPublicClient } from "@/lib/supabase/public";

/**
 * Options for the lead form selects (§5.1 quick enquiry: university, course
 * type, course). Published public data, so it goes through the anon client and
 * is baked into the static render like the rest of the page.
 */
export async function getLeadFormOptions() {
  const supabase = createPublicClient();

  const [colleges, courses] = await Promise.all([
    supabase
      .from("colleges")
      .select("id, name, short_name")
      .eq("status", "published")
      .order("name", { ascending: true }),
    supabase
      .from("courses")
      .select("id, name, short_name, level")
      .eq("status", "published")
      .order("name", { ascending: true }),
  ]);

  if (colleges.error) throw new Error(`colleges: ${colleges.error.message}`);
  if (courses.error) throw new Error(`courses: ${courses.error.message}`);

  return {
    colleges: (colleges.data ?? []).map((college) => ({
      id: college.id,
      name: college.name,
    })),
    courses: (courses.data ?? []).map((course) => ({
      id: course.id,
      name: course.short_name ?? course.name,
      level: course.level,
    })),
  };
}

export type LeadFormOptions = Awaited<ReturnType<typeof getLeadFormOptions>>;
export type CourseOption = LeadFormOptions["courses"][number];
export type CollegeOption = LeadFormOptions["colleges"][number];
