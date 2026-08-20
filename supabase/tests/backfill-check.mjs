/**
 * Reproduces the live situation exactly: leads collected BEFORE the CRM
 * migrations ran, so the after-insert bridge never saw them. Then asserts the
 * backfill picks them up and maps them the same way the trigger would.
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
for (const f of ["0001_init","0002_rls","0003_storage","0004_review_rating_guard","0005_applicant_photos"]) {
  await db.exec(read(`supabase/migrations/${f}.sql`));
}

// Leads captured while the site ran without a CRM -- the trigger does not
// exist yet, which is precisely why these were never bridged.
console.log("Before the CRM existed:");
await db.exec(`
  insert into leads (name, phone, email, city, source, page_url, level, message,
                     utm_source, answers) values
    ('Old Lead One','9800000001','one@x.com','Patna','home_hero','/', 'ug','call me','google','{}'::jsonb),
    ('Old Lead Two','9800000002',null,null,'college_finder','/college-finder','after_12',null,null,
     '{"stream":"engineering","budget":"2L"}'::jsonb),
    ('Old Lead Three','9800000003','', '', 'apply_now','/colleges/iit-patna',null,null,null,null)`);
const before = (await db.query(`select count(*)::int n from leads`)).rows[0];
check(before.n === 3, "leads collected with no CRM in place", `${before.n} rows`);

await db.exec(read("supabase/apply/01-roles.sql"));
await db.exec(read("supabase/apply/02-crm-schema.sql"));
const bridged = (await db.query(`select count(*)::int n from crm.leads`)).rows[0];
check(bridged.n === 0, "after the migration they are STILL not in the CRM", `crm.leads = ${bridged.n}`);

console.log("\nAfter the backfill:");
await db.exec(read("supabase/migrations/0025_backfill_website_leads.sql"));
const after = (await db.query(`select count(*)::int n from crm.leads`)).rows[0];
check(after.n === 3, "every website lead reached the pipeline", `crm.leads = ${after.n}`);

const one = (await db.query(`
  select full_name, phone, email, city, source, status, phone_last10,
         metadata->>'website_source' ws, metadata->>'page_url' pu,
         metadata->>'level' lvl, metadata->'answers'->>'stream' stream
  from crm.leads where phone_last10='9800000001'`)).rows[0];
check(one?.source === "website" && one?.status === "new", "mapped as a new website lead",
  `${one?.source}/${one?.status}`);
check(one?.ws === "home_hero" && one?.pu === "/" && one?.lvl === "ug",
  "website source, page and level kept in metadata", `${one?.ws}, ${one?.pu}, ${one?.lvl}`);

const finder = (await db.query(`
  select metadata->'answers'->>'stream' s from crm.leads where phone_last10='9800000002'`)).rows[0];
check(finder?.s === "engineering", "college-finder answers preserved", finder?.s);

const blanks = (await db.query(`
  select email, city from crm.leads where phone_last10='9800000003'`)).rows[0];
check(blanks?.email === null && blanks?.city === null,
  "empty strings normalised to null, as the trigger does");

// Re-running must not duplicate, and must not disturb what is already there.
await db.exec(read("supabase/migrations/0025_backfill_website_leads.sql"));
await db.exec(read("supabase/migrations/0025_backfill_website_leads.sql"));
const again = (await db.query(`select count(*)::int n from crm.leads`)).rows[0];
check(again.n === 3, "running it three times still yields three leads", `${again.n}`);

// And the trigger must keep working for genuinely new leads afterwards.
await db.exec(`insert into leads (name, phone, source) values ('Fresh','9800000004','contact')`);
const fresh = (await db.query(`select count(*)::int n from crm.leads`)).rows[0];
check(fresh.n === 4, "new leads still bridge automatically after a backfill", `${fresh.n}`);

console.log(failures === 0 ? "\nBackfill verified." : `\n${failures} CHECK(S) FAILED`);
process.exit(failures === 0 ? 0 : 1);
