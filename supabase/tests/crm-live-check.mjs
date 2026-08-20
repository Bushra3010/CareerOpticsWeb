/**
 * Reports whether the live project is ready for the CRM screens:
 * are the migrations applied, and is the `crm` schema exposed to PostgREST?
 *
 *   node supabase/tests/crm-live-check.mjs
 */
import { readFileSync } from "node:fs";

const env = Object.fromEntries(
  readFileSync(".env.local", "utf8").split("\n")
    .filter((l) => l.includes("=") && !l.trim().startsWith("#"))
    .map((l) => { const i = l.indexOf("="); return [l.slice(0, i).trim(), l.slice(i + 1).trim().replace(/^["']|["']$/g, "")]; })
);
const url = env.NEXT_PUBLIC_SUPABASE_URL;
const key = env.SUPABASE_SERVICE_ROLE_KEY;
const ref = url?.match(/https:\/\/([a-z0-9]+)\./)?.[1];

const hit = async (path, schema) => {
  const h = { apikey: key, Authorization: `Bearer ${key}` };
  if (schema) h["Accept-Profile"] = schema;
  const r = await fetch(`${url}/rest/v1/${path}`, { headers: h });
  return { status: r.status, body: await r.text() };
};

console.log(`project ref: ${ref}`);

const probe = await hit("leads?select=id&limit=1", "crm");

if (probe.status === 406 && probe.body.includes("PGRST106")) {
  console.log("\nSTEP 3 NOT DONE — the `crm` schema is not exposed to the API.");
  const exposed = probe.body.match(/exposed: ([^"]+)/)?.[1];
  console.log(`  currently exposed: ${exposed}`);
  console.log("\n  Because PostgREST rejects the request before it reaches the");
  console.log("  database, this cannot tell you whether the SQL blocks ran yet.");
  console.log("  Do step 3, then run this again — it will confirm both at once.");
  console.log(`\n  https://supabase.com/dashboard/project/${ref}/settings/api`);
} else if (probe.status === 404 || probe.body.includes("PGRST205")) {
  console.log("\nSchema IS exposed, but crm.leads does not exist.");
  console.log("  -> the SQL blocks have not been run yet. Do steps 1 and 2.");
} else if (probe.status === 200) {
  console.log("\nBoth done. Checking the tables the CRM screens read:");
  const tables = ["leads","students","payments","lead_activities","appointments",
    "notifications","student_documents","associates","employees","attendance",
    "payroll","revenue_targets","student_mentorships","department_litigations",
    "lead_capture_forms","student_uploads"];
  let missing = 0;
  for (const t of tables) {
    const r = await hit(`${t}?select=*&limit=1`, "crm");
    if (r.status !== 200) { missing++; console.log(`  MISSING crm.${t} (${r.status})`); }
  }
  console.log(missing === 0
    ? `  all ${tables.length} tables reachable — the CRM is ready to use.`
    : `  ${missing} table(s) missing — re-run 02-crm-schema.sql.`);
} else {
  console.log(`\nUnexpected: ${probe.status} ${probe.body.slice(0, 200)}`);
}
