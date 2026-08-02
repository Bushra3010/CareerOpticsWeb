import type { Metadata } from "next";
import Link from "next/link";

import { ArrowRight, Inbox } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { can, requireStaff } from "@/lib/auth";
import { STATUS_LABELS } from "@/config/leads";
import { getDashboardStats } from "@/lib/queries/admin";

export const metadata: Metadata = {
  title: "Dashboard",
  robots: { index: false, follow: false },
};

/** `/admin` — §5.5 dashboard. */
export default async function AdminDashboard() {
  const profile = await requireStaff();

  // An editor has no lead access, so the counts would all read zero under RLS.
  if (!can(profile.role, "leads")) {
    return (
      <div>
        <h1 className="text-h2">Welcome, {profile.full_name ?? "there"}</h1>
        <p className="mt-2 text-body">
          Your account manages content. Pick a section from the sidebar to get
          started.
        </p>
      </div>
    );
  }

  const stats = await getDashboardStats();
  const maxSource = Math.max(1, ...stats.sources.map((s) => s.count));

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-h2">Dashboard</h1>
        <Button asChild>
          <Link href="/admin/leads">
            <Inbox />
            Open leads inbox
          </Link>
        </Button>
      </div>

      <dl className="mt-6 grid gap-4 sm:grid-cols-3">
        <Stat label="Leads today" value={stats.today} />
        <Stat label="Last 7 days" value={stats.week} />
        <Stat label="Last 30 days" value={stats.month} />
      </dl>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <section className="rounded-xl border bg-card p-5">
          <h2 className="text-h3">Where leads come from</h2>
          <p className="mt-1 text-sm text-muted-foreground">Last 30 days.</p>

          {stats.sources.length === 0 ? (
            <p className="mt-4 text-body">No leads in the last 30 days.</p>
          ) : (
            <ul className="mt-4 grid gap-3">
              {stats.sources.map((row) => (
                <li key={row.source}>
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium text-ink">
                      {row.source.replace(/_/g, " ")}
                    </span>
                    <span className="text-muted-foreground tabular-nums">
                      {row.count}
                    </span>
                  </div>
                  <div className="mt-1 h-2 overflow-hidden rounded-full bg-brand-blue-50">
                    <div
                      className="h-full rounded-full bg-brand-blue"
                      style={{ width: `${(row.count / maxSource) * 100}%` }}
                    />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="rounded-xl border bg-card p-5">
          <h2 className="text-h3">Top colleges by lead</h2>
          <p className="mt-1 text-sm text-muted-foreground">Last 30 days.</p>

          {stats.topColleges.length === 0 ? (
            <p className="mt-4 text-body">
              No leads carried a college yet. Apply Now and brochure requests do.
            </p>
          ) : (
            <ul className="mt-4 grid gap-2">
              {stats.topColleges.map((college) => (
                <li key={college.slug}>
                  <Link
                    href={`/colleges/${college.slug}`}
                    target="_blank"
                    className="flex items-center justify-between gap-3 rounded-lg px-2 py-2 hover:bg-surface focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
                  >
                    <span className="min-w-0 truncate font-medium text-ink">
                      {college.name}
                    </span>
                    <span className="shrink-0 font-semibold text-brand-blue tabular-nums">
                      {college.count}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      <section className="mt-6 rounded-xl border bg-card p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-h3">Pipeline</h2>
          <Link
            href="/admin/leads"
            className="inline-flex items-center gap-1 text-sm font-semibold text-brand-blue-400 hover:underline"
          >
            All leads
            <ArrowRight className="size-4" aria-hidden />
          </Link>
        </div>

        <ul className="mt-4 flex flex-wrap gap-2">
          {stats.statuses.map((row) => (
            <li key={row.status}>
              <Link href={`/admin/leads?status=${row.status}`}>
                <Badge
                  variant={row.count > 0 ? "secondary" : "outline"}
                  className="gap-1.5"
                >
                  {STATUS_LABELS[row.status]}
                  <span className="tabular-nums">{row.count}</span>
                </Badge>
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border bg-card p-5">
      <dt className="text-sm text-muted-foreground">{label}</dt>
      <dd className="mt-1 font-display text-h1 text-brand-blue tabular-nums">
        {value}
      </dd>
    </div>
  );
}
