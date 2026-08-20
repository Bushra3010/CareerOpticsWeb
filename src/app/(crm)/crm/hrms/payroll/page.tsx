import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { Wallet } from "lucide-react";

import { ActionButton, ActionSelect } from "@/components/crm/action-controls";
import { CRM_CONTROL, CrmEmpty, CrmPageHeader, CrmStat, CrmTable, CrmTabs, HRMS_TABS } from "@/components/crm/crm-ui";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  MONTHS,
  PAYROLL_STATUSES,
  PAYROLL_STATUS_LABELS,
  type PayrollStatus,
} from "@/config/crm";
import { generatePayslip, setPayrollStatus } from "@/app/(crm)/crm/phase2-actions";
import { isCrmManager, requireStaff } from "@/lib/auth";
import { formatInr } from "@/lib/media";
import { listEmployees, listPayroll } from "@/lib/queries/crm";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Payroll",
  robots: { index: false, follow: false },
};

const TONE: Record<PayrollStatus, "secondary" | "success" | "outline"> = {
  draft: "outline",
  processed: "secondary",
  paid: "success",
};

export default async function PayrollPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const profile = await requireStaff();
  if (!isCrmManager(profile.role)) redirect("/crm");

  const params = await searchParams;
  const now = new Date();
  const month = Number(params.month ?? now.getMonth() + 1);
  const year = Number(params.year ?? now.getFullYear());

  const [slips, employees] = await Promise.all([
    listPayroll(month, year),
    listEmployees(),
  ]);

  const slipByEmployee = new Map(slips.map((s) => [s.employee_id as string, s]));
  const missing = employees.filter((e) => !slipByEmployee.has(e.id as string));

  const gross = slips.reduce((sum, s) => sum + Number(s.gross ?? 0), 0);
  const net = slips.reduce((sum, s) => sum + Number(s.net ?? 0), 0);
  const paid = slips.filter((s) => s.status === "paid").length;

  const years = [year - 1, year, year + 1];

  return (
    <div>
      <CrmPageHeader
        title="Payroll"
        description="Payslips are computed from each employee's saved salary components, not from the form."
      />
      <CrmTabs tabs={HRMS_TABS} current="/crm/hrms/payroll" />

      <dl className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <CrmStat label="Payslips" value={String(slips.length)} />
        <CrmStat label="Gross" value={formatInr(gross) ?? "₹0"} />
        <CrmStat label="Net payable" value={formatInr(net) ?? "₹0"} />
        <CrmStat label="Marked paid" value={`${paid} of ${slips.length}`} tone={paid === slips.length && slips.length > 0 ? "success" : undefined} />
      </dl>

      <form className="mt-6 flex flex-wrap items-end gap-3 rounded-xl border bg-card p-4">
        <div className="grid gap-1.5">
          <label htmlFor="pr-month" className="text-sm font-medium text-ink">Month</label>
          <select id="pr-month" name="month" defaultValue={String(month)} className={`${CRM_CONTROL} w-[160px]`}>
            {MONTHS.map((label, i) => (
              <option key={label} value={i + 1}>{label}</option>
            ))}
          </select>
        </div>
        <div className="grid gap-1.5">
          <label htmlFor="pr-year" className="text-sm font-medium text-ink">Year</label>
          <select id="pr-year" name="year" defaultValue={String(year)} className={`${CRM_CONTROL} w-[120px]`}>
            {years.map((y) => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>
        <Button type="submit">Show</Button>
      </form>

      {missing.length > 0 ? (
        <section className="mt-6 rounded-xl border border-brand-orange/40 bg-card p-5">
          <h2 className="text-h3">Not yet generated</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {missing.length} employee{missing.length === 1 ? "" : "s"} have no payslip for{" "}
            {MONTHS[month - 1]} {year}.
          </p>
          <ul className="mt-4 grid gap-2">
            {missing.map((e) => (
              <li key={e.id} className="flex flex-wrap items-center justify-between gap-3 rounded-lg border p-3">
                <span className="text-sm">
                  <span className="font-semibold text-ink">{e.profile?.full_name ?? "Unnamed"}</span>
                  <span className="ml-2 text-muted-foreground tabular-nums">{e.employee_code}</span>
                </span>
                <ActionButton
                  action={generatePayslip}
                  payload={{
                    employee_id: e.id as string,
                    month: String(month),
                    year: String(year),
                  }}
                >
                  Generate
                </ActionButton>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {slips.length === 0 ? (
        <CrmEmpty title="No payslips yet" icon={<Wallet className="size-8" aria-hidden />}>
          Generate them from the list above.
        </CrmEmpty>
      ) : (
        <CrmTable
          caption={`Payroll for ${MONTHS[month - 1]} ${year}`}
          headers={["Employee", "Gross", "Deductions", "Net", "Status"]}
          minWidth={880}
        >
          {slips.map((s) => {
            const employee = employees.find((e) => e.id === s.employee_id);
            const deductions =
              Number(s.pf ?? 0) + Number(s.tds ?? 0) +
              Number(s.other_deductions ?? 0) + Number(s.advance_deduction ?? 0);
            return (
              <tr key={s.id} className="border-t align-top">
                <td className="p-3">
                  <span className="font-medium text-ink">
                    {employee?.profile?.full_name ?? "—"}
                  </span>
                  <span className="block text-sm text-muted-foreground tabular-nums">
                    {employee?.employee_code ?? ""}
                  </span>
                </td>
                <td className="p-3 tabular-nums">{formatInr(Number(s.gross ?? 0))}</td>
                <td className="p-3 tabular-nums text-muted-foreground">
                  {formatInr(deductions)}
                  {Number(s.advance_deduction ?? 0) > 0 ? (
                    <span className="block text-sm">
                      incl. advance {formatInr(Number(s.advance_deduction))}
                    </span>
                  ) : null}
                </td>
                <td className="p-3 font-semibold text-ink tabular-nums">
                  {formatInr(Number(s.net ?? 0))}
                </td>
                <td className="p-3">
                  <Badge variant={TONE[s.status as PayrollStatus]} size="sm">
                    {PAYROLL_STATUS_LABELS[s.status as PayrollStatus]}
                  </Badge>
                  {s.payment_date ? (
                    <span className="block text-sm text-muted-foreground tabular-nums">
                      {s.payment_date}
                    </span>
                  ) : null}
                  <div className="mt-2">
                    <ActionSelect
                      action={setPayrollStatus}
                      name="status"
                      value={s.status as string}
                      hidden={{ id: s.id as string }}
                      label="Payslip status"
                      width={150}
                      options={PAYROLL_STATUSES.map((p) => ({
                        value: p, label: PAYROLL_STATUS_LABELS[p],
                      }))}
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
