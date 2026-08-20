import type { Metadata } from "next";
import { redirect } from "next/navigation";

import {
  CRM_SOURCE_LABELS,
  CRM_STATUS_LABELS,
  CRM_STUDENT_STATUS_LABELS,
  type CrmLeadSource,
  type CrmLeadStatus,
  type CrmStudentStatus,
} from "@/config/crm";
import { can, requireStaff } from "@/lib/auth";
import { formatInr } from "@/lib/media";
import { getCrmAnalytics } from "@/lib/queries/crm";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "CRM analytics",
  robots: { index: false, follow: false },
};

/**
 * `/admin/crm/analytics` — where leads come from and what converts.
 *
 * Server-rendered with no chart library: these are all part-of-whole counts,
 * and a labelled bar carries them without the ~40 kB a chart package costs on
 * a route that already sits inside the §11 budget.
 */
export default async function CrmAnalyticsPage() {
  const profile = await requireStaff();
  if (!can(profile.role, "leads")) redirect("/admin");

  const a = await getCrmAnalytics();

  return (
    <div>
      <h1 className="text-h2">Analytics</h1>
      <p className="mt-1 text-body">
        Sources, pipeline and collections across the whole CRM.
      </p>

      <dl className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Total leads" value={a.totalLeads.toLocaleString("en-IN")} />
        <Stat label="Students" value={a.totalStudents.toLocaleString("en-IN")} />
        <Stat label="Collected" value={formatInr(a.revenue) ?? "₹0"} />
        <Stat
          label="Conversion (30 days)"
          value={`${a.conversionRate.toFixed(1)}%`}
          hint={`${a.recentLeads} lead${a.recentLeads === 1 ? "" : "s"} in the last 30 days`}
        />
      </dl>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <Breakdown
          title="Where leads come from"
          rows={a.leadsBySource.map(([key, value]) => ({
            label: CRM_SOURCE_LABELS[key as CrmLeadSource] ?? key,
            value,
          }))}
          total={a.totalLeads}
          empty="No leads yet."
        />
        <Breakdown
          title="Pipeline by status"
          rows={a.leadsByStatus.map(([key, value]) => ({
            label: CRM_STATUS_LABELS[key as CrmLeadStatus] ?? key,
            value,
          }))}
          total={a.totalLeads}
          empty="No leads yet."
        />
        <Breakdown
          title="Students by status"
          rows={a.studentsByStatus.map(([key, value]) => ({
            label: CRM_STUDENT_STATUS_LABELS[key as CrmStudentStatus] ?? key,
            value,
          }))}
          total={a.totalStudents}
          empty="No students yet."
        />
        <Breakdown
          title="Collections by payment mode"
          rows={a.revenueByMode.map(([key, value]) => ({
            label: key.toUpperCase(),
            value,
            display: formatInr(value) ?? "₹0",
          }))}
          total={a.revenue}
          empty="No payments recorded yet."
        />
      </div>
    </div>
  );
}

function Stat({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <div className="rounded-xl border bg-card p-5">
      <dt className="text-sm text-muted-foreground">{label}</dt>
      <dd className="mt-1 font-display text-h2 text-brand-blue tabular-nums">
        {value}
      </dd>
      {hint ? <p className="mt-1 text-sm text-muted-foreground">{hint}</p> : null}
    </div>
  );
}

function Breakdown({
  title,
  rows,
  total,
  empty,
}: {
  title: string;
  rows: { label: string; value: number; display?: string }[];
  total: number;
  empty: string;
}) {
  return (
    <section className="rounded-xl border bg-card p-5">
      <h2 className="text-h3">{title}</h2>

      {rows.length === 0 ? (
        <p className="mt-4 rounded-lg border border-dashed p-4 text-body">{empty}</p>
      ) : (
        <ul className="mt-4 grid gap-2">
          {rows.map((row) => {
            const share = total > 0 ? (row.value / total) * 100 : 0;
            return (
              <li key={row.label}>
                <span className="flex items-center justify-between text-sm">
                  <span className="font-medium text-ink">{row.label}</span>
                  <span className="text-muted-foreground tabular-nums">
                    {row.display ?? row.value.toLocaleString("en-IN")}
                  </span>
                </span>
                {/* Decorative: the number beside it is the accessible value. */}
                <span
                  aria-hidden
                  className="mt-1 block h-1.5 overflow-hidden rounded-full bg-brand-blue-50"
                >
                  <span
                    className="block h-full rounded-full bg-brand-blue"
                    style={{ width: `${share}%` }}
                  />
                </span>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
