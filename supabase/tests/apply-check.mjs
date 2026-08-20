/**
 * Runs the generated supabase/apply/*.sql blocks against PGlite exactly the way
 * the Supabase SQL Editor would: block 1, then block 2 — then BOTH AGAIN, to
 * prove a half-finished run can simply be re-run.
 */
import { readFileSync } from "node:fs";
import { PGlite } from "@electric-sql/pglite";
import { pg_trgm } from "@electric-sql/pglite/contrib/pg_trgm";

const read = (p) => readFileSync(p, "utf8").replace(/create extension[^;]+;/gi, "");
let failures = 0;
const check = (ok, label, detail = "") => {
  if (!ok) failures++;
  console.log(`  ${ok ? "PASS" : "FAIL"} ${label}${detail ? ` -- ${detail}` : ""}`);
};

const db = await new PGlite({ extensions: { pg_trgm } });
await db.exec(`
  create extension if not exists pg_trgm;
  create schema auth; create schema storage;
  create table auth.users (id uuid primary key default gen_random_uuid(), email text,
    raw_user_meta_data jsonb default '{}'::jsonb);
  create or replace function auth.uid() returns uuid language sql stable as
    $$ select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
  create table storage.buckets (id text primary key, name text not null, public boolean default false,
    file_size_limit bigint, allowed_mime_types text[]);
  create table storage.objects (id uuid primary key default gen_random_uuid(),
    bucket_id text references storage.buckets(id), name text, owner uuid);
  alter table storage.objects enable row level security;
  do $$ begin create role anon;          exception when duplicate_object then null; end $$;
  do $$ begin create role authenticated; exception when duplicate_object then null; end $$;
  do $$ begin create role service_role;  exception when duplicate_object then null; end $$;
`);

// The live project already has 0001-0005; reproduce that starting point.
console.log("Baseline (what the live project already has):");
for (const f of ["0001_init", "0002_rls", "0003_storage", "0004_review_rating_guard", "0005_applicant_photos"]) {
  await db.exec(read(`supabase/migrations/${f}.sql`));
}
check(true, "0001-0005 applied");

const run = async (label, file) => {
  try {
    await db.exec(read(file));
    check(true, label);
    return true;
  } catch (e) {
    check(false, label, e.message.split("\n")[0]);
    return false;
  }
};

console.log("\nFirst run (the paste the user will do):");
await run("block 1 - roles", "supabase/apply/01-roles.sql");
await run("block 2 - crm schema", "supabase/apply/02-crm-schema.sql");

console.log("\nSecond run (proves a failed paste can be retried):");
await run("block 1 again", "supabase/apply/01-roles.sql");
await run("block 2 again", "supabase/apply/02-crm-schema.sql");

console.log("\nResulting schema:");
const one = async (q) => (await db.query(q)).rows[0];

const t = await one(`select count(*)::int n from pg_tables where schemaname='crm'`);
check(t.n >= 40, "crm tables created", `${t.n} tables`);

const noRls = await db.query(`
  select c.relname from pg_class c join pg_namespace n on n.oid=c.relnamespace
  where n.nspname='crm' and c.relkind='r' and not c.relrowsecurity`);
check(noRls.rows.length === 0, "RLS enabled on every crm table",
  noRls.rows.map(r => r.relname).join(", ") || "all covered");

const pol = await one(`select count(*)::int n from pg_policies where schemaname='crm'`);
check(pol.n > 0, "policies present", `${pol.n} policies`);

// The re-run must not have left duplicates behind.
const dup = await db.query(`
  select schemaname, tablename, policyname, count(*)::int n
  from pg_policies where schemaname='crm'
  group by 1,2,3 having count(*) > 1`);
check(dup.rows.length === 0, "no duplicate policies after the second run",
  dup.rows.map(r => `${r.tablename}.${r.policyname}`).join(", ") || "none");

const roles = await db.query(`
  select enumlabel from pg_enum e join pg_type t on t.oid=e.enumtypid
  where t.typname='user_role' order by enumlabel`);
const labels = roles.rows.map(r => r.enumlabel);
check(["telecaller","backend","finance","associate","student"].every(r => labels.includes(r)),
  "all five CRM roles on the enum", labels.join(", "));

// The bridge is the whole point of the merge: a website lead must appear in CRM.
await db.exec(`
  insert into leads (name, phone, source, page_url)
  values ('Apply SQL Test','9812345678','college_finder','/college-finder')`);
const bridged = await one(`
  select full_name, source, status, phone_last10, metadata->>'website_source' ws
  from crm.leads where phone_last10='9812345678'`);
check(!!bridged, "website lead reached crm.leads");
check(bridged?.source === "website" && bridged?.ws === "college_finder",
  "website source folded into metadata", `${bridged?.source} / ${bridged?.ws}`);

// Converting a lead must create exactly one student, as pending.
await db.exec(`update crm.leads set status='converted' where phone_last10='9812345678'`);
const st = await one(`select count(*)::int n, min(status) s, min(enrollment_number) e from crm.students`);
check(st.n === 1 && st.s === "pending", "conversion creates one pending student",
  `${st.n} row(s), ${st.s}, ${st.e}`);

// 0023's grants are what make PostgREST able to see the phase-2 tables at all.
const g = await one(`
  select count(*)::int n from information_schema.role_table_grants
  where table_schema='crm' and grantee='authenticated' and privilege_type='SELECT'`);
check(g.n >= 40, "authenticated granted select across crm", `${g.n} tables`);

// A static sweep of the generated files. The runtime failure above only shows
// the FIRST unguarded statement, so a scan is what actually proves the whole
// file is retriable rather than just further along than last time.
console.log("\nGenerated SQL is fully guarded:");
for (const f of ["supabase/apply/01-roles.sql", "supabase/apply/02-crm-schema.sql"]) {
  const lines = readFileSync(f, "utf8").split("\n");
  const bare = [];
  lines.forEach((line, i) => {
    const kind = /create\s+policy/i.test(line) ? "policy"
      : /^\s*create\s+trigger/i.test(line) ? "trigger"
      : /add\s+constraint/i.test(line) ? "constraint" : null;
    if (!kind || /^\s*(drop|--)/i.test(line)) return;
    const prev = lines.slice(Math.max(0, i - 3), i).join("\n");
    if (!new RegExp(`drop\\s+${kind}\\s+if\\s+exists`, "i").test(prev)
        && !/drop policy if exists/i.test(line)) {
      bare.push(`L${i + 1} ${kind}: ${line.trim().slice(0, 60)}`);
    }
  });
  check(bare.length === 0, `${f.split("/").pop()} has no unguarded DDL`,
    bare.slice(0, 3).join(" | ") || "clean");
}

console.log(failures === 0
  ? "\nAll checks passed — both blocks apply cleanly and are safe to re-run."
  : `\n${failures} CHECK(S) FAILED`);
process.exit(failures === 0 ? 0 : 1);
