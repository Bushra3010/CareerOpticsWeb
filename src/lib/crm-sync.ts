import "server-only";

import { createClient } from "@supabase/supabase-js";

import { publicEnv, serverEnv } from "@/lib/env";

/**
 * Keeps `crm.courses` in step with the website's course catalogue.
 *
 * The CRM's lead and student forms list each college's courses by matching
 * website course names to CRM courses (see crm/lib/website-catalog.ts), so
 * every website course needs a CRM course of the same name.
 *
 * - New website course → a CRM course with that name.
 * - Renamed website course → the CRM course is renamed in place, so leads and
 *   students already on it keep it.
 *
 * Service role, because CRM course rows are CRM-admin-only under RLS and a
 * website editor is not a CRM admin. The caller has already passed the
 * website's staff + content check; this only ever writes `crm.courses.name`.
 * Never throws: a CRM hiccup must not fail a website save.
 */
export async function syncCrmCourse(previousName: string | null, name: string) {
  const next = name.trim();
  if (!next) return;

  try {
    const crm = createClient(publicEnv.supabaseUrl, serverEnv.supabaseServiceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
      db: { schema: "crm" },
    });

    const { data: existing } = await crm.from("courses").select("id").eq("name", next).limit(1);
    if (existing?.length) return;

    if (previousName && previousName !== next) {
      const { data: renamed } = await crm
        .from("courses")
        .update({ name: next })
        .eq("name", previousName)
        .select("id");
      if (renamed?.length) return;
    }

    await crm.from("courses").insert({ name: next, is_active: true });
  } catch (error) {
    console.error("CRM course sync failed:", error);
  }
}
