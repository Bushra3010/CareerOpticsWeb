import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { AlertCircle, ArrowRight, Inbox, Users } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CRM_OPEN_STATUSES, CRM_STATUS_LABELS, type CrmLeadStatus } from "@/config/crm";
import { can, requireStaff } from "@/lib/auth";
import { getCrmLeadCounts, getCrmMoneyStats, getDueFollowUps } from "@/lib/queries/crm";
import { formatInr } from "@/lib/media";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "CRM",
  robots: { index: false, follow: false },
};

/** `/crm` — the consultancy's working view: what is open, what is due. */
export default async function CrmDashboard() {
  const profile = await requireStaff();
  if (!can(profile.role, "leads")) redirect("/admin");

  const [counts, due, money] = await Promise.all([
    getCrmLeadCounts(),
    getDueFollowUps(),
    getCrmMoneyStats(),
  ]);

  const today = new Date().toISOString().slice(0, 10);

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-h2">CRM</h1>
          <p className="mt-1 text-body">
            Admission pipeline, students and fees.
          </p>
        </div>
        <div className="flex gap-2">
          <Button asChild variant="outline">
            <Link href="/crm/students"><Users />Students</Link>
          </Button>
          <Button asChild>
            <Link href="/crm/leads"><Inbox />Open leads</Link>
          </Button>
        </div>
      </div>

      <dl className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Open leads" value={String(counts.open)} />
        <Stat label="Follow-ups due" value={String(due.length)} tone={due.length > 0 ? "urgent" : undefined} />
        <Stat label="Collected (30 days)" value={formatInr(money.collected30) ?? "₹0"} />
        <Stat label="Outstanding" value={formatInr(money.outstanding) ?? "₹0"} />
      </dl>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <section className="rounded-xl border bg-card p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="flex items-center gap-2 text-h3">
              <AlertCircle className="size-5 text-brand-orange" aria-hidden />
              Call list
            </h2>
            <Link
              href="/crm/leads"
              className="text-sm font-semibold text-brand-blue-400 hover:underline"
            >
              All leads
            </Link>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            Follow-ups due today or overdue.
          </p>

          {due.length === 0 ? (
            <p className="mt-4 rounded-lg border border-dashed p-4 text-body">
              Nothing due. Set follow-up dates from a lead to build tomorrow&apos;s list.
            </p>
          ) : (
            <ul className="mt-4 grid gap-2">
              {due.map((lead) => (
                <li key={lead.id}>
                  <Link
                    href={`/crm/leads/${lead.id}`}
                    className="flex items-center justify-between gap-3 rounded-lg px-2 py-2 hover:bg-surface focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
                  >
                    <span className="min-w-0">
                      <span className="block truncate font-medium text-ink">
                        {lead.full_name}
                      </span>
                      <span className="block text-sm text-muted-foreground tabular-nums">
                        {lead.phone}
                      </span>
                    </span>
                    <Badge
                      variant={
                        (lead.next_followup_date ?? "") < today ? "urgent" : "secondary"
                      }
                      size="sm"
                    >
                      {(lead.next_followup_date ?? "") < today ? "Overdue" : "Today"}
                    </Badge>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="rounded-xl border bg-card p-5">
          <h2 className="text-h3">Pipeline</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {counts.total} leads in total.
          </p>

          <ul className="mt-4 grid gap-2">
            {CRM_OPEN_STATUSES.concat(["converted", "lost", "not_interested"] as CrmLeadStatus[]).map(
              (status) => {
                const value = counts.byStatus.get(status) ?? 0;
                const share = counts.total > 0 ? (value / counts.total) * 100 : 0;
                return (
                  <li key={status}>
                    <Link
                      href={`/crm/leads?status=${status}&view=all`}
                      className="block rounded-lg px-2 py-1.5 hover:bg-surface focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
                    >
                      <span className="flex items-center justify-between text-sm">
                        <span className="font-medium text-ink">
                          {CRM_STATUS_LABELS[status]}
                        </span>
                        <span className="text-muted-foreground tabular-nums">{value}</span>
                      </span>
                      <span className="mt-1 block h-1.5 overflow-hidden rounded-full bg-brand-blue-50">
                        <span
                          className="block h-full rounded-full bg-brand-blue"
                          style={{ width: `${share}%` }}
                        />
                      </span>
                    </Link>
                  </li>
                );
              },
            )}
          </ul>

          <Link
            href="/crm/students?status=pending"
            className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-brand-blue-400 hover:underline"
          >
            Students waiting for approval
            <ArrowRight className="size-4" aria-hidden />
          </Link>
        </section>
      </div>
    </div>
  );
}

function Stat({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone?: "urgent";
}) {
  return (
    <div className="rounded-xl border bg-card p-5">
      <dt className="text-sm text-muted-foreground">{label}</dt>
      <dd
        className={
          tone === "urgent"
            ? "mt-1 font-display text-h2 text-brand-orange tabular-nums"
            : "mt-1 font-display text-h2 text-brand-blue tabular-nums"
        }
      >
        {value}
      </dd>
    </div>
  );
}
