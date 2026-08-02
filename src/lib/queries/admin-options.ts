import type { SelectOptions } from "@/components/admin/entity-form";
import { fieldsFor } from "@/config/admin-fields";
import { createClient } from "@/lib/supabase/server";

/**
 * Options for the admin form's foreign-key selects (§5.5).
 *
 * Only the tables a section's config actually references are queried — the
 * banners form has no selects, so it costs no round trips.
 */
export async function getSelectOptions(section: string): Promise<SelectOptions> {
  const needed = new Set(
    fieldsFor(section)
      .map((field) => field.optionsFrom)
      .filter(Boolean) as string[],
  );
  if (needed.size === 0) return {};

  const supabase = await createClient();
  const options: SelectOptions = {};

  if (needed.has("colleges")) {
    const { data } = await supabase
      .from("colleges")
      .select("id, name")
      .order("name");
    options.colleges = (data ?? []).map((row) => ({ value: row.id, label: row.name }));
  }

  if (needed.has("courses")) {
    const { data } = await supabase
      .from("courses")
      .select("id, name, short_name")
      .order("name");
    options.courses = (data ?? []).map((row) => ({
      value: row.id,
      label: row.short_name ? `${row.short_name} — ${row.name}` : row.name,
    }));
  }

  if (needed.has("streams")) {
    const { data } = await supabase.from("streams").select("id, name").order("sort_order");
    options.streams = (data ?? []).map((row) => ({ value: row.id, label: row.name }));
  }

  if (needed.has("cities")) {
    const { data } = await supabase
      .from("cities")
      .select("id, name, states(name)")
      .order("name");
    options.cities = (data ?? []).map((row) => ({
      // 120 cities with repeated names across states — the state disambiguates.
      value: row.id,
      label: row.states?.name ? `${row.name}, ${row.states.name}` : row.name,
    }));
  }

  return options;
}

/** One row of a managed section, for the edit form. */
export async function getSectionRow(table: string, id: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    // The table name is resolved from the section allowlist by the caller.
    .from(table as "colleges")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) throw new Error(`${table} ${id}: ${error.message}`);
  return data as Record<string, unknown> | null;
}
