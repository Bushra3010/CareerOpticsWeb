import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { Target } from "lucide-react";

import { ActionButton, Disclosure } from "@/components/crm/action-controls";
import { ActionForm } from "@/components/crm/action-form";
import { CrmEmpty, CrmPageHeader, CrmStat } from "@/components/crm/crm-ui";
import { Badge } from "@/components/ui/badge";
import { TARGET_PERIODS, TARGET_PERIOD_LABELS } from "@/config/crm";
import { archiveTarget, saveTarget } from "@/app/(crm)/crm/phase2-actions";
import { can, isCrmManager, requireStaff } from "@/lib/auth";
import { formatInr } from "@/lib/media";
import { listStaff, listTargetsWithProgress } from "@/lib/queries/crm";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Targets",
  robots: { index: false, follow: false },
};

export default async function TargetsPage() {
  const profile = await requireStaff();
  if (!can(profile.role, "leads")) redirect("/admin");

  const manager = isCrmManager(profile.role);
  const [targets, staff] = await Promise.all([
    listTargetsWithProgress("active"),
    manager ? listStaff() : Promise.resolve([]),
  ]);

  const byId = new Map(staff.map((s) => [s.id, s.full_name ?? "Unnamed"]));
  const totalTarget = targets.reduce((sum, t) => sum + Number(t.target_amount ?? 0), 0);
  const totalActual = targets.reduce((sum, t) => sum + t.actual.revenue, 0);
  const today = new Date().toISOString().slice(0, 10);

  return (
    <div>
      <CrmPageHeader
        title="Targets"
        description="Revenue and conversion targets, measured from payments recorded inside the window."
      />

      <dl className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <CrmStat label="Active targets" value={String(targets.length)} />
        <CrmStat label="Committed" value={formatInr(totalTarget) ?? "₹0"} />
        <CrmStat
          label="Achieved"
          value={formatInr(totalActual) ?? "₹0"}
          tone={totalActual >= totalTarget && totalTarget > 0 ? "success" : undefined}
          hint={totalTarget > 0 ? `${((totalActual / totalTarget) * 100).toFixed(0)}% of committed` : undefined}
        />
      </dl>

      {manager ? (
        <div className="mt-6">
          <Disclosure label="Set a target">
            <ActionForm
              action={saveTarget}
              submitLabel="Save target"
              fields={[
                {
                  name: "assignee_id", label: "Who", type: "select", required: true,
                  options: staff.map((s) => ({ value: s.id, label: s.full_name ?? "Unnamed" })),
                },
                { name: "title", label: "Title", required: true, defaultValue: "Revenue target" },
                { name: "target_amount", label: "Revenue target (₹)", type: "number", step: "any", min: "0", required: true },
                { name: "lead_target", label: "Lead target", type: "number", min: "0", defaultValue: 0 },
                { name: "conversion_target", label: "Conversion target", type: "number", min: "0", defaultValue: 0 },
                {
                  name: "period_type", label: "Period", type: "select", required: true,
                  options: TARGET_PERIODS.map((p) => ({ value: p, label: TARGET_PERIOD_LABELS[p] })),
                  defaultValue: "monthly",
                },
                { name: "start_date", label: "From", type: "date", required: true },
                { name: "end_date", label: "To", type: "date", required: true },
                { name: "bonus_percentage", label: "Bonus %", type: "number", step: "any", min: "0", defaultValue: 0 },
                { name: "notes", label: "Notes", type: "textarea" },
              ]}
            />
          </Disclosure>
        </div>
      ) : null}

      {targets.length === 0 ? (
        <CrmEmpty title="No active targets" icon={<Target className="size-8" aria-hidden />}>
          {manager
            ? "Set one above to start tracking against it."
            : "A manager has not set you a target yet."}
        </CrmEmpty>
      ) : (
        <div className="mt-6 grid gap-4 lg:grid-cols-2">
          {targets.map((t) => {
            const revenueShare =
              Number(t.target_amount) > 0
                ? Math.min(100, (t.actual.revenue / Number(t.target_amount)) * 100)
                : 0;
            const expired = (t.end_date as string) < today;

            return (
              <section key={t.id} className="rounded-xl border bg-card p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h2 className="text-h3">{t.title}</h2>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {byId.get(t.assignee_id as string) ?? "Unassigned"} ·{" "}
                      {TARGET_PERIOD_LABELS[t.period_type as keyof typeof TARGET_PERIOD_LABELS]} ·{" "}
                      <span className="tabular-nums">{t.start_date} → {t.end_date}</span>
                    </p>
                  </div>
                  {expired ? <Badge variant="urgent" size="sm">Window closed</Badge> : null}
                </div>

                <div className="mt-4">
                  <div className="flex items-baseline justify-between text-sm">
                    <span className="font-medium text-ink">Revenue</span>
                    <span className="tabular-nums text-muted-foreground">
                      {formatInr(t.actual.revenue) ?? "₹0"} of {formatInr(Number(t.target_amount)) ?? "₹0"}
                    </span>
                  </div>
                  <span aria-hidden className="mt-1 block h-2 overflow-hidden rounded-full bg-brand-blue-50">
                    <span
                      className={
                        revenueShare >= 100
                          ? "block h-full rounded-full bg-success"
                          : "block h-full rounded-full bg-brand-blue"
                      }
                      style={{ width: `${revenueShare}%` }}
                    />
                  </span>
                </div>

                <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <dt className="text-muted-foreground">Leads</dt>
                    <dd className="font-semibold text-ink tabular-nums">
                      {t.actual.leads} / {t.lead_target}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground">Conversions</dt>
                    <dd className="font-semibold text-ink tabular-nums">
                      {t.actual.conversions} / {t.conversion_target}
                    </dd>
                  </div>
                </dl>

                {t.notes ? (
                  <p className="mt-3 text-sm text-muted-foreground">{t.notes}</p>
                ) : null}

                {manager ? (
                  <div className="mt-4">
                    <ActionButton
                      action={archiveTarget}
                      payload={{ id: t.id as string }}
                      confirm="Archive this target?"
                    >
                      Archive
                    </ActionButton>
                  </div>
                ) : null}
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}
