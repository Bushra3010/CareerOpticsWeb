import { CheckCircle2, XCircle } from "lucide-react";

import { hasSupabaseCredentials } from "@/lib/env";
import {
  getPublicTableCounts,
  getSampleColleges,
  leadsAreProtected,
} from "@/lib/queries/health";

/**
 * P1 verification page (PRD §16): proves the migrations applied, the seed
 * loaded and the anon RLS policies behave. Temporary — delete once P3 ships.
 */
export const dynamic = "force-dynamic";

export const metadata = {
  title: "Database check",
  robots: { index: false, follow: false },
};

export default async function DbCheckPage() {
  if (!hasSupabaseCredentials()) {
    return (
      <main className="container-site py-12 lg:py-16">
        <h1 className="heading-underline text-h2">Database check</h1>
        <p className="mt-6 max-w-prose">
          Supabase credentials are not set. Add{" "}
          <code className="rounded bg-muted px-1.5 py-0.5 text-sm">
            NEXT_PUBLIC_SUPABASE_URL
          </code>{" "}
          and{" "}
          <code className="rounded bg-muted px-1.5 py-0.5 text-sm">
            NEXT_PUBLIC_SUPABASE_ANON_KEY
          </code>{" "}
          to <code>.env.local</code>, then run{" "}
          <code className="rounded bg-muted px-1.5 py-0.5 text-sm">
            pnpm db:push
          </code>{" "}
          to apply the migrations.
        </p>
      </main>
    );
  }

  const [counts, colleges, leadsProtected] = await Promise.all([
    getPublicTableCounts(),
    getSampleColleges().catch(() => []),
    leadsAreProtected().catch(() => false),
  ]);

  const failures = counts.filter((c) => c.error !== null);

  return (
    <main className="container-site py-12 lg:py-16">
      <h1 className="heading-underline text-h2">Database check</h1>

      <div className="mt-8 flex flex-wrap gap-3">
        <StatusPill ok={failures.length === 0}>
          {failures.length === 0
            ? "All public tables readable"
            : `${failures.length} table(s) unreadable`}
        </StatusPill>
        <StatusPill ok={leadsProtected}>
          {leadsProtected
            ? "leads blocked for anon"
            : "leads READABLE by anon — check RLS"}
        </StatusPill>
      </div>

      <h2 className="mt-10 text-h3">Row counts</h2>
      <div className="mt-4 overflow-x-auto rounded-xl border">
        <table className="w-full text-left text-sm">
          <thead className="bg-muted text-ink">
            <tr>
              <th className="px-4 py-2 font-semibold">Table</th>
              <th className="px-4 py-2 text-right font-semibold">Rows</th>
              <th className="px-4 py-2 font-semibold">Error</th>
            </tr>
          </thead>
          <tbody>
            {counts.map((row) => (
              <tr key={row.table} className="border-t">
                <td className="px-4 py-2 font-medium text-ink">{row.table}</td>
                <td className="px-4 py-2 text-right tabular-nums">
                  {row.count ?? "—"}
                </td>
                <td className="px-4 py-2 text-brand-red">{row.error ?? ""}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <h2 className="mt-10 text-h3">Sample colleges</h2>
      {colleges.length === 0 ? (
        <p className="mt-4">
          No rows returned. Run <code>pnpm db:reset</code> to load{" "}
          <code>supabase/seed.sql</code>.
        </p>
      ) : (
        <ul className="mt-4 grid gap-3 sm:grid-cols-2">
          {colleges.map((college) => (
            <li key={college.id} className="rounded-xl border bg-card p-4">
              <p className="font-display font-bold text-ink">{college.name}</p>
              <p className="text-sm text-muted-foreground">
                {college.cities?.name}
                {college.cities?.states?.name
                  ? `, ${college.cities.states.name}`
                  : ""}
                {college.naac_grade ? ` · NAAC ${college.naac_grade}` : ""}
              </p>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}

function StatusPill({
  ok,
  children,
}: {
  ok: boolean;
  children: React.ReactNode;
}) {
  const Icon = ok ? CheckCircle2 : XCircle;
  return (
    <span
      className={`flex items-center gap-2 rounded-full px-3 py-1.5 text-sm font-semibold ${
        ok ? "bg-brand-blue-50 text-success" : "bg-brand-blue-50 text-brand-red"
      }`}
    >
      <Icon className="size-4" aria-hidden />
      {children}
    </span>
  );
}
