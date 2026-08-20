/**
 * Runs migrations + seed against PGlite (WASM Postgres) and asserts the schema,
 * the §14 seed counts and the RLS policies behave. No Docker or Supabase project
 * needed, so this works in CI and before the project is linked.
 *
 *   pnpm db:verify
 *
 * Supabase-managed objects (auth, storage, the anon/authenticated roles) are
 * stubbed here — they exist for real on Supabase.
 */
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { PGlite } from "@electric-sql/pglite";
import { pg_trgm } from "@electric-sql/pglite/contrib/pg_trgm";

const SUPABASE_DIR = join(dirname(fileURLToPath(import.meta.url)), "..");

// `create extension` is stripped: pg_trgm is loaded through PGlite's extension
// API below, and gen_random_uuid() is in core Postgres since v13.
const read = (p) =>
  readFileSync(join(SUPABASE_DIR, p), "utf8").replace(
    /create extension[^;]+;/gi,
    "",
  );

const EXPECTED_ROWS = {
  states: 36,
  cities: 120,
  streams: 10,
  courses: 60,
  colleges: 25,
  exams: 12,
  testimonials: 8,
  faqs: 6,
  banners: 3,
  scholarships: 1,
  gallery: 6,
  press_releases: 4,
  college_courses: 67,
  exam_courses: 39,
  settings: 2,
};

let failures = 0;

function check(ok, label, detail = "") {
  if (!ok) failures++;
  console.log(`  ${ok ? "✓" : "✗"} ${label}${detail ? ` — ${detail}` : ""}`);
}

async function boot() {
  const db = await new PGlite({ extensions: { pg_trgm } });
  await db.exec(`
    create extension if not exists pg_trgm;
    create schema auth;
    create schema storage;

    create table auth.users (
      id uuid primary key default gen_random_uuid(),
      email text,
      raw_user_meta_data jsonb default '{}'::jsonb
    );
    create or replace function auth.uid() returns uuid language sql stable as
      $$ select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;

    create table storage.buckets (id text primary key, name text not null, public boolean default false);
    create table storage.objects (
      id uuid primary key default gen_random_uuid(),
      bucket_id text references storage.buckets(id), name text, owner uuid
    );
    alter table storage.objects enable row level security;

    do $$ begin create role anon;          exception when duplicate_object then null; end $$;
    do $$ begin create role authenticated; exception when duplicate_object then null; end $$;
    do $$ begin create role service_role;  exception when duplicate_object then null; end $$;
  `);

  for (const file of [
    "migrations/0001_init.sql",
    "migrations/0002_rls.sql",
    "migrations/0003_storage.sql",
    "migrations/0004_review_rating_guard.sql",
    "migrations/0005_crm_roles.sql",
    "migrations/0006_crm_schema.sql",
    "seed.sql",
  ]) {
    try {
      await db.exec(read(file));
      console.log(`  ✓ ${file}`);
    } catch (err) {
      console.error(`  ✗ ${file}\n    ${err.message}`);
      process.exit(1);
    }
  }
  return db;
}

const count = async (db, table) =>
  (await db.query(`select count(*)::int as n from ${table}`)).rows[0].n;

console.log("Applying migrations and seed:");
const db = await boot();

console.log("\nSeed counts (PRD §14):");
for (const [table, want] of Object.entries(EXPECTED_ROWS)) {
  const got = await count(db, table);
  check(got === want, table, `${got} (expected ${want})`);
}

console.log("\nReferential integrity:");
for (const [label, query] of [
  ["cities have a state", "select count(*)::int n from cities where state_id is null"],
  ["courses have a stream", "select count(*)::int n from courses where stream_id is null"],
  ["colleges have a city", "select count(*)::int n from colleges where city_id is null"],
  ["college_courses fully linked", "select count(*)::int n from college_courses where college_id is null or course_id is null"],
  ["testimonials linked to a college", "select count(*)::int n from testimonials where college_id is null"],
]) {
  const { rows } = await db.query(query);
  check(rows[0].n === 0, label, `${rows[0].n} orphan(s)`);
}

console.log("\nSchema guarantees:");
const { rows: noRls } = await db.query(`
  select c.relname from pg_class c
  join pg_namespace n on n.oid = c.relnamespace
  where n.nspname = 'public' and c.relkind = 'r' and not c.relrowsecurity
`);
check(noRls.length === 0, "RLS enabled on every public table", noRls.map((r) => r.relname).join(", "));

const { rows: anonPolicies } = await db.query(`
  select tablename, policyname from pg_policies
  where schemaname = 'public'
    and tablename in ('leads','finder_sessions','lead_activities','profiles','settings')
    and roles::text like '%anon%'
`);
check(anonPolicies.length === 0, "no anon policy on private tables", anonPolicies.map((p) => `${p.tablename}.${p.policyname}`).join(", "));

// Regression for 0004: a *pending* review on a college that has no approved
// reviews must leave the existing rating alone. Before the guard this zeroed
// the rating, which any visitor could trigger through the public /api/reviews.
const { rows: seeded } = await db.query(
  `select rating::float8 as rating from colleges where slug = 'nit-patna'`,
);
await db.exec(`
  insert into reviews (college_id, name, rating, body, is_approved)
  select id, 'Pending', 1, 'spam', false from colleges where slug = 'nit-patna';
`);
const { rows: afterPending } = await db.query(
  `select rating::float8 as rating, review_count from colleges where slug = 'nit-patna'`,
);
check(
  afterPending[0].rating === seeded[0].rating && afterPending[0].review_count === 0,
  "pending review does not touch college rating",
  `rating ${afterPending[0].rating} (seeded ${seeded[0].rating}), count ${afterPending[0].review_count}`,
);

await db.exec(`
  insert into reviews (college_id, name, rating, body, is_approved)
  select id, 'A', 5, 'x', true from colleges where slug = 'iit-patna';
  insert into reviews (college_id, name, rating, body, is_approved)
  select id, 'B', 4, 'y', true from colleges where slug = 'iit-patna';
  insert into reviews (college_id, name, rating, body, is_approved)
  select id, 'C', 1, 'z', false from colleges where slug = 'iit-patna';
`);
const { rows: rated } = await db.query(
  `select rating::float8 as rating, review_count from colleges where slug = 'iit-patna'`,
);
check(
  rated[0].rating === 4.5 && rated[0].review_count === 2,
  "review trigger recomputes college rating",
  `rating ${rated[0].rating}, count ${rated[0].review_count}`,
);

console.log("\nCRM (0006):");
{
  // A website lead must land in the CRM pipeline automatically, with its
  // page-level source folded into metadata since crm.leads.source is a
  // constrained vocabulary that would reject 'college_finder'.
  await db.exec(`
    insert into leads (name, phone, email, city, source, page_url, answers)
    values ('Bridge Test','9800011122','b@example.com','Patna','college_finder',
            'http://x/college-finder', '{"stream":"engineering"}'::jsonb);
  `);
  const { rows } = await db.query(`
    select l.full_name, l.phone, l.source, l.status, l.phone_last10,
           l.metadata->>'website_source' as website_source,
           l.metadata->'answers'->>'stream' as answer_stream
      from crm.leads l where l.phone = '9800011122'
  `);
  check(rows.length === 1, "website lead reaches crm.leads");
  const r = rows[0] || {};
  check(r.full_name === "Bridge Test" && r.source === "website" && r.status === "new",
    "bridged lead is mapped correctly", `${r.full_name} / ${r.source} / ${r.status}`);
  check(r.website_source === "college_finder" && r.answer_stream === "engineering",
    "page source and finder answers kept in metadata", `${r.website_source}, ${r.answer_stream}`);
  check(r.phone_last10 === "9800011122", "phone_last10 computed", r.phone_last10);

  // Converting a lead must create exactly one pending student, and be
  // idempotent if the status is flipped back and forth.
  await db.exec(`update crm.leads set status='converted' where phone='9800011122'`);
  await db.exec(`update crm.leads set status='interested' where phone='9800011122'`);
  await db.exec(`update crm.leads set status='converted' where phone='9800011122'`);
  const { rows: st } = await db.query(
    `select enrollment_number, status, full_name from crm.students`);
  check(st.length === 1, "conversion creates exactly one student", `${st.length} row(s)`);
  check(st[0]?.status === "pending", "student lands as pending, not active", st[0]?.status);
  check(/^CO-\d{4}-\d{5}$/.test(st[0]?.enrollment_number ?? ""),
    "enrollment number format", st[0]?.enrollment_number);

  const { rows: crmRls } = await db.query(`
    select c.relname from pg_class c join pg_namespace n on n.oid=c.relnamespace
    where n.nspname='crm' and c.relkind='r' and not c.relrowsecurity`);
  check(crmRls.length === 0, "RLS enabled on every crm table",
    crmRls.map((r) => r.relname).join(", "));
}

console.log("\nSeed idempotency (re-run):");
await db.exec(read("seed.sql"));
for (const [table, want] of Object.entries(EXPECTED_ROWS)) {
  const got = await count(db, table);
  if (got !== want) check(false, table, `${got} after re-run (expected ${want})`);
}
check(true, "all tables unchanged after a second seed run");

console.log("\nRLS as role `anon`:");
await db.exec(`
  insert into colleges (name, slug, status) values ('Draft College','draft-college','draft');
  insert into leads (name, phone, source) values ('Test','9876543210','home_hero');
  insert into finder_sessions (session_id, step, answers) values ('s1',1,'{}'::jsonb);
  grant usage on schema public to anon, authenticated;
  grant select, insert, update, delete on all tables in schema public to anon, authenticated;
  set role anon;
`);

for (const [label, query, want] of [
  ["published colleges visible", "select count(*)::int n from colleges", 25],
  ["draft college hidden", "select count(*)::int n from colleges where slug='draft-college'", 0],
  ["approved reviews only", "select count(*)::int n from reviews", 2],
  ["leads hidden", "select count(*)::int n from leads", 0],
  ["finder_sessions hidden", "select count(*)::int n from finder_sessions", 0],
  ["profiles hidden", "select count(*)::int n from profiles", 0],
  ["settings hidden", "select count(*)::int n from settings", 0],
]) {
  const { rows } = await db.query(query);
  check(rows[0].n === want, label, `${rows[0].n} (expected ${want})`);
}

for (const [label, query] of [
  ["anon cannot insert a lead", "insert into leads (name, phone, source) values ('X','9999999999','x')"],
  ["anon cannot insert a college", "insert into colleges (name, slug) values ('X','x')"],
  ["anon cannot insert a review", "insert into reviews (name, rating, body) values ('X',5,'x')"],
]) {
  try {
    await db.query(query);
    check(false, label, "write succeeded");
  } catch {
    check(true, label);
  }
}

// UPDATE/DELETE with no matching policy affect zero rows rather than erroring,
// so assert on the data instead of on whether the statement threw.
for (const [label, mutation, verify, want] of [
  ["anon update on colleges is a no-op", "update colleges set name='Hacked' where slug='iit-patna'", "select count(*)::int n from colleges where name='Hacked'", 0],
  ["anon delete on colleges is a no-op", "delete from colleges where slug='iit-patna'", "select count(*)::int n from colleges where slug='iit-patna'", 1],
  ["anon update on leads is a no-op", "update leads set status='junk'", "select count(*)::int n from leads where status='junk'", 0],
]) {
  try {
    await db.query(mutation);
  } catch {
    // rejected outright is also fine
  }
  await db.exec("reset role");
  const { rows } = await db.query(verify);
  await db.exec("set role anon");
  check(rows[0].n === want, label, `${rows[0].n} (expected ${want})`);
}

await db.exec("reset role");
console.log(
  failures === 0
    ? "\nAll database checks passed."
    : `\n${failures} check(s) failed.`,
);
process.exit(failures === 0 ? 0 : 1);
