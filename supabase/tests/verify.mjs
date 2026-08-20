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
import { readFileSync, readdirSync } from "node:fs";
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

    create table storage.buckets (
      id text primary key, name text not null, public boolean default false,
      file_size_limit bigint, allowed_mime_types text[]
    );
    create table storage.objects (
      id uuid primary key default gen_random_uuid(),
      bucket_id text references storage.buckets(id), name text, owner uuid
    );
    alter table storage.objects enable row level security;

    do $$ begin create role anon;          exception when duplicate_object then null; end $$;
    do $$ begin create role authenticated; exception when duplicate_object then null; end $$;
    do $$ begin create role service_role;  exception when duplicate_object then null; end $$;
  `);

  // Read the directory rather than listing files here: a hardcoded list goes
  // stale the moment a migration is added or renumbered, and it fails as a
  // missing-file error that looks nothing like the real problem.
  const migrations = readdirSync(new URL("../migrations/", import.meta.url))
    .filter((f) => f.endsWith(".sql"))
    .sort()
    .map((f) => `migrations/${f}`);

  for (const file of [...migrations, "seed.sql"]) {
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

console.log("\nCRM:");
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

  // The bulk importer's write shape: `excel_import` source, a batch stamp, and
  // messy spreadsheet phone formats that must all collapse onto one dedupe key.
  await db.exec(`
    insert into crm.leads (full_name, phone, source, status, import_batch_id)
    values ('Import One','+91 98000 22233','excel_import','new','import-20260820-ab12'),
           ('Import Two','098000 22244','excel_import','new','import-20260820-ab12')`);

  const { rows: imported } = await db.query(`
    select phone_last10 from crm.leads
    where import_batch_id='import-20260820-ab12' order by phone_last10`);
  check(imported.length === 2 && imported[0].phone_last10 === "9800022233"
    && imported[1].phone_last10 === "9800022244",
    "imported rows normalise to a 10-digit dedupe key",
    imported.map((r) => r.phone_last10).join(", "));

  // The importer's duplicate check is `where phone_last10 in (...)`. If the
  // trigger ever stopped normalising, a re-import would silently double every
  // lead — this asserts a differently formatted copy of the same number is
  // found by that lookup.
  const { rows: dupe } = await db.query(`
    select count(*)::int n from crm.leads where phone_last10 in ('9800022233')`);
  check(dupe[0].n === 1, "a reformatted number is caught by the dedupe lookup",
    `${dupe[0].n} match(es)`);

  let rejected = false;
  try {
    await db.exec(`insert into crm.leads (full_name, phone, source)
                   values ('Bad Source','9800022255','linkedin')`);
  } catch { rejected = true; }
  check(rejected, "an unknown lead source is rejected by the CHECK constraint");

  await db.exec(`delete from crm.leads where import_batch_id='import-20260820-ab12'`);

  const { rows: crmRls } = await db.query(`
    select c.relname from pg_class c join pg_namespace n on n.oid=c.relnamespace
    where n.nspname='crm' and c.relkind='r' and not c.relrowsecurity`);
  check(crmRls.length === 0, "RLS enabled on every crm table",
    crmRls.map((r) => r.relname).join(", "));

  // A crm table with RLS on but no GRANT to `authenticated` denies every
  // PostgREST request before a policy is consulted — the screen renders an
  // empty list with no error, which is the hardest failure of all to spot.
  const { rows: ungranted } = await db.query(`
    select c.relname from pg_class c join pg_namespace n on n.oid=c.relnamespace
    where n.nspname='crm' and c.relkind='r'
      and not has_table_privilege('authenticated', c.oid, 'select')`);
  check(ungranted.length === 0, "every crm table is granted to authenticated",
    ungranted.map((r) => r.relname).join(", "));

  // The phase-2 port added these; a rename or a dropped migration should fail
  // here rather than at runtime on a screen nobody opened yet.
  const expected = [
    "appointments", "associates", "associate_wallet_txns", "attendance",
    "department_litigations", "employees", "expenses", "lead_capture_forms",
    "leave_requests", "payroll", "revenue_targets", "student_documents",
    "student_exams", "student_mentorships", "student_uploads", "study_materials",
  ];
  const { rows: present } = await db.query(`
    select c.relname from pg_class c join pg_namespace n on n.oid=c.relnamespace
    where n.nspname='crm' and c.relkind='r'`);
  const have = new Set(present.map((r) => r.relname));
  const missing = expected.filter((t) => !have.has(t));
  check(missing.length === 0, "phase-2 crm tables all exist",
    missing.length ? `missing: ${missing.join(", ")}` : `${expected.length} tables`);

  // crm.payroll's FK back to crm.employees is deferred to 0019 because
  // advance_salaries.settled_in forces payroll to be created first. If that
  // deferred ALTER is ever dropped, payroll rows would orphan silently.
  const { rows: pfk } = await db.query(`
    select 1 from pg_constraint where conname = 'payroll_employee_fk'`);
  check(pfk.length === 1, "payroll.employee_id FK to employees was applied");

  // The sidebar decides who sees HRMS/finance from PERMISSIONS[role].manager;
  // the database decides what they can actually read from crm.is_manager().
  // If those two lists drift, a manager-only page renders for someone whose
  // queries then return nothing — an empty screen with no error.
  const authSrc = readFileSync(join(SUPABASE_DIR, "../src/lib/auth.ts"), "utf8");
  const uiManagers = [...authSrc.matchAll(/^\s*(\w+): \{[^}]*manager: true/gm)]
    .map((m) => m[1])
    .sort();

  const { rows: fnDef } = await db.query(`
    select pg_get_functiondef(p.oid) as def
      from pg_proc p join pg_namespace n on n.oid = p.pronamespace
     where n.nspname = 'crm' and p.proname = 'is_manager'`);
  const dbManagers = [...(fnDef[0]?.def ?? "").matchAll(/'(\w+)'/g)]
    .map((m) => m[1])
    .filter((r) => r !== "public")
    .sort();

  check(
    uiManagers.length > 0 && uiManagers.join(",") === dbManagers.join(","),
    "UI manager roles match crm.is_manager()",
    `ui: ${uiManagers.join(", ")} · db: ${dbManagers.join(", ")}`,
  );
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
