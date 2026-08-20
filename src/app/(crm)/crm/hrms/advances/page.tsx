import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { HandCoins } from "lucide-react";

import { ActionSelect, Disclosure } from "@/components/crm/action-controls";
import { ActionForm } from "@/components/crm/action-form";
import { CrmEmpty, CrmPageHeader, CrmStat, CrmTable, CrmTabs, HRMS_TABS } from "@/components/crm/crm-ui";
import { Badge } from "@/components/ui/badge";
import { recordAdvance, setAdvanceStatus } from "@/app/(crm)/crm/phase2-actions";
import { isCrmManager, requireStaff } from "@/lib/auth";
import { formatInr } from "@/lib/media";
import { listAdvances, listEmployees } from "@/lib/queries/crm";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Advances",
  robots: { index: false, follow: false },
};

const ADVANCE_STATUSES = [
  { value: "pending", label: "Outstanding" },
  { value: "settled", label: "Settled" },
  { value: "cancelled", label: "Cancelled" },
] as const;

export default async function AdvancesPage() {
  const profile = await requireStaff();
  if (!isCrmManager(profile.role)) redirect("/crm");

  const [rows, employees] = await Promise.all([listAdvances(), listEmployees()]);
  const byId = new Map(employees.map((e) => [e.id as string, e]));

  const outstanding = rows
    .filter((r) => r.status === "pending")
    .reduce((sum, r) => sum + Number(r.amount ?? 0), 0);
  const settled = rows
    .filter((r) => r.status === "settled")
    .reduce((sum, r) => sum + Number(r.amount ?? 0), 0);

  return (
    <div>
      <CrmPageHeader
        title="Salary advances"
        description="Money paid ahead of payroll. Deduct it on the payslip when settling."
      />
      <CrmTabs tabs={HRMS_TABS} current="/crm/hrms/advances" />

      <dl className="mt-6 grid gap-4 sm:grid-cols-3">
        <CrmStat label="Advances" value={String(rows.length)} />
        <CrmStat label="Outstanding" value={formatInr(outstanding) ?? "₹0"} tone={outstanding > 0 ? "urgent" : undefined} />
        <CrmStat label="Settled" value={formatInr(settled) ?? "₹0"} tone="success" />
      </dl>

      <div className="mt-6">
        <Disclosure label="Record an advance">
          <ActionForm
            action={recordAdvance}
            submitLabel="Record advance"
            fields={[
              {
                name: "employee_id", label: "Employee", type: "select", required: true,
                options: employees.map((e) => ({
                  value: e.id as string,
                  label: `${e.profile?.full_name ?? "Unnamed"} · ${e.employee_code}`,
                })),
              },
              { name: "amount", label: "Amount (₹)", type: "number", step: "any", min: "1", required: true },
              { name: "given_on", label: "Given on", type: "date", required: true,
                defaultValue: new Date().toISOString().slice(0, 10) },
              { name: "reason", label: "Reason", wide: true },
            ]}
          />
        </Disclosure>
      </div>

      {rows.length === 0 ? (
        <CrmEmpty title="No advances" icon={<HandCoins className="size-8" aria-hidden />}>
          Record one above when someone is paid ahead of payroll.
        </CrmEmpty>
      ) : (
        <CrmTable
          caption="Salary advances"
          headers={["Employee", "Amount", "Given", "Reason", "Status"]}
          minWidth={840}
        >
          {rows.map((row) => {
            const employee = byId.get(row.employee_id as string);
            return (
              <tr key={row.id} className="border-t align-top">
                <td className="p-3">
                  <span className="font-medium text-ink">
                    {employee?.profile?.full_name ?? "—"}
                  </span>
                  <span className="block text-sm text-muted-foreground tabular-nums">
                    {employee?.employee_code ?? ""}
                  </span>
                </td>
                <td className="p-3 font-semibold text-ink tabular-nums">
                  {formatInr(Number(row.amount ?? 0))}
                </td>
                <td className="p-3 text-sm text-muted-foreground tabular-nums">
                  {row.given_on}
                </td>
                <td className="p-3 text-sm text-muted-foreground">{row.reason || "—"}</td>
                <td className="p-3">
                  <Badge
                    variant={row.status === "settled" ? "success" : row.status === "cancelled" ? "outline" : "secondary"}
                    size="sm"
                  >
                    {ADVANCE_STATUSES.find((s) => s.value === row.status)?.label ?? row.status}
                  </Badge>
                  <div className="mt-2">
                    <ActionSelect
                      action={setAdvanceStatus}
                      name="status"
                      value={row.status as string}
                      hidden={{ id: row.id as string }}
                      label="Advance status"
                      width={150}
                      options={ADVANCE_STATUSES}
                    />
                  </div>
                </td>
              </tr>
            );
          })}
        </CrmTable>
      )}
    </div>
  );
}
