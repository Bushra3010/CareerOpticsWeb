// Import the real partner-college fee structures (data.mjs) and hide the
// placeholder colleges from seed.sql.
//
//   node --env-file=.env.local scripts/fees-2026/import.mjs           # dry run
//   node --env-file=.env.local scripts/fees-2026/import.mjs --apply   # write
//
// Idempotent: colleges are matched by slug and their course rows are replaced
// on every run. Placeholder colleges are set to `draft`, never deleted, so the
// change is reversible from /admin.
import { createClient } from "@supabase/supabase-js";

import { COLLEGES, NEW_CITIES, NEW_COURSES } from "./data.mjs";

const APPLY = process.argv.includes("--apply");
const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

const must = (res, what) => {
  if (res.error) throw new Error(`${what}: ${res.error.message}`);
  return res.data;
};
const log = (...a) => console.log(APPLY ? "" : "[dry]", ...a);

const streams = Object.fromEntries(must(await db.from("streams").select("id, slug"), "streams").map((s) => [s.slug, s.id]));
const states = Object.fromEntries(must(await db.from("states").select("id, slug"), "states").map((s) => [s.slug, s.id]));
let cities = Object.fromEntries(must(await db.from("cities").select("id, slug"), "cities").map((c) => [c.slug, c.id]));
let courses = Object.fromEntries(must(await db.from("courses").select("id, slug"), "courses").map((c) => [c.slug, c.id]));

// 1. Cities
for (const [slug, name, state] of NEW_CITIES) {
  if (cities[slug]) continue;
  log("add city", slug);
  if (APPLY) must(await db.from("cities").insert({ slug, name, state_id: states[state] }), `city ${slug}`);
}

// 2. Courses
for (const [slug, name, short_name, stream, level, months] of NEW_COURSES) {
  if (courses[slug]) continue;
  if (!streams[stream]) throw new Error(`unknown stream ${stream} for ${slug}`);
  log("add course", slug);
  if (APPLY)
    must(
      await db.from("courses").insert({ slug, name, short_name, stream_id: streams[stream], level, duration_months: months, status: "published" }),
      `course ${slug}`,
    );
}
if (APPLY) {
  cities = Object.fromEntries(must(await db.from("cities").select("id, slug"), "cities").map((c) => [c.slug, c.id]));
  courses = Object.fromEntries(must(await db.from("courses").select("id, slug"), "courses").map((c) => [c.slug, c.id]));
}

// 3. Colleges + fee rows
const keep = new Set();
let rowCount = 0;
for (const col of COLLEGES) {
  keep.add(col.slug);
  if (col.city && !cities[col.city] && !NEW_CITIES.some(([s]) => s === col.city)) throw new Error(`unknown city ${col.city}`);
  const seen = new Set();
  const rows = col.courses.map((r) => {
    if (!courses[r.c] && !NEW_COURSES.some(([s]) => s === r.c)) throw new Error(`${col.slug}: unknown course ${r.c}`);
    if (seen.has(r.c)) throw new Error(`${col.slug}: duplicate course ${r.c}`);
    seen.add(r.c);
    const years = r.months / 12;
    const perYear = r.perYear ?? Math.round(r.total / years);
    const total = r.total ?? Math.round(r.perYear * years);
    return {
      course: r.c,
      fee_per_year: perYear,
      total_fee: total,
      duration_months: r.months,
      eligibility: [r.elig, r.note].filter(Boolean).join(" · ") || null,
    };
  });
  rowCount += rows.length;
  log(`college ${col.slug}: ${rows.length} courses`);

  if (!APPLY) continue;
  const record = {
    slug: col.slug,
    name: col.name,
    short_name: col.short_name,
    city_id: col.city ? cities[col.city] : null,
    type: col.type,
    naac_grade: col.naac,
    approvals: col.approvals,
    address: col.address ?? null,
    website: col.website ?? null,
    about: col.about,
    status: "published",
    is_featured: true,
  };
  const saved = must(await db.from("colleges").upsert(record, { onConflict: "slug" }).select("id").single(), `college ${col.slug}`);
  must(await db.from("college_courses").delete().eq("college_id", saved.id), `clear ${col.slug}`);
  must(
    await db.from("college_courses").insert(
      rows.map(({ course, ...r }) => ({ ...r, college_id: saved.id, course_id: courses[course] })),
    ),
    `fees ${col.slug}`,
  );
}

// 4. Hide the seed.sql placeholder colleges
const others = must(await db.from("colleges").select("id, slug, status"), "colleges").filter((c) => !keep.has(c.slug) && c.status === "published");
log(`hide ${others.length} placeholder colleges:`, others.map((c) => c.slug).join(", "));
if (APPLY && others.length)
  must(await db.from("colleges").update({ status: "draft", is_featured: false }).in("id", others.map((c) => c.id)), "hide placeholders");

console.log(`\n${APPLY ? "Applied" : "Dry run"}: ${COLLEGES.length} colleges, ${rowCount} fee rows.`);
