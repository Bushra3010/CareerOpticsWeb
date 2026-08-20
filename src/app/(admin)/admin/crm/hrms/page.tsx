import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { Users } from "lucide-react";

import { Disclosure } from "@/components/crm/action-controls";
import { ActionForm } from "@/components/crm/action-form";
import {
  CrmEmpty,
  CrmPageHeader,
  CrmStat,
  CrmTable,
  CrmTabs,
  HRMS_TABS,
} from "@/components/crm/crm-ui";
import { Badge } from "@/components/ui/badge";
import { saveEmployee } from "@/app/(admin)/admin/crm/phase2-actions";
import { isCrmManager, requireStaff } from "@/lib/auth";
import { formatInr } from "@/lib/media";
import { listEmployees, listStaff } from "@/lib/queries/crm";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Employees",
  robots: { index: false, follow: false },
};

export default async function HrmsPage() {
  const profile = await requireStaff();
  // HRMS is salary data. RLS restricts it to managers anyway; this is the
  // useful redirect rather than an empty table.
  if (!isCrmManager(profile.role)) redirect("/admin/crm");

  const [employees, staff] = await Promise.all([listEmployees(true), listStaff()]);

  const active = employees.filter((e) => e.is_active);
  const monthly = active.reduce(
    (sum, e) =>
      sum +
      Number(e.basic_salary ?? 0) +
      Number(e.hra ?? 0) +
      Number(e.allowances ?? 0),
    0,
  );

  // Staff who do not have an employee record yet — the only valid picks.
  const linked = new Set(employees.map((e) => e.profile_id));
  const unlinked = staff.filter((s) => !linked.has(s.id));

  return (
    <div>
      <CrmPageHeader title="HRMS" description="Staff records, salary components and bank details." />
      <CrmTabs tabs={HRMS_TABS} current="/admin/crm/hrms" />

      <dl className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <CrmStat label="Active employees" value={String(active.length)} />
        <CrmStat label="Monthly payroll" value={formatInr(monthly) ?? "₹0"} />
        <CrmStat label="Staff without a record" value={String(unlinked.length)}
          tone={unlinked.length > 0 ? "urgent" : undefined} />
      </dl>

      <div className="mt-6">
        <Disclosure label="Add an employee record">
          {unlinked.length === 0 ? (
            <p className="text-body">
              Every active staff account already has an employee record. Create the
              staff account in Supabase first.
            </p>
          ) : (
            <ActionForm
              action={saveEmployee}
              submitLabel="Save employee"
              fields={[
                {
                  name: "profile_id", label: "Staff member", type: "select", required: true,
                  options: unlinked.map((s) => ({ value: s.id, label: s.full_name ?? "Unnamed" })),
                },
                { name: "employee_code", label: "Employee code", required: true, placeholder: "EMP-1024" },
                { name: "department", label: "Department" },
                { name: "designation", label: "Designation" },
                { name: "joining_date", label: "Joined on", type: "date" },
                { name: "basic_salary", label: "Basic (₹)", type: "number", step: "any", min: "0", defaultValue: 0 },
                { name: "hra", label: "HRA (₹)", type: "number", step: "any", min: "0", defaultValue: 0 },
                { name: "allowances", label: "Allowances (₹)", type: "number", step: "any", min: "0", defaultValue: 0 },
                { name: "incentive", label: "Incentive (₹)", type: "number", step: "any", min: "0", defaultValue: 0 },
                { name: "pf_deduction", label: "PF (₹)", type: "number", step: "any", min: "0", defaultValue: 0 },
                { name: "tds_deduction", label: "TDS (₹)", type: "number", step: "any", min: "0", defaultValue: 0 },
                { name: "other_deductions", label: "Other deductions (₹)", type: "number", step: "any", min: "0", defaultValue: 0 },
                { name: "bank_name", label: "Bank" },
                { name: "bank_account", label: "Account no." },
                { name: "bank_ifsc", label: "IFSC" },
              ]}
            />
          )}
        </Disclosure>
      </div>

      {employees.length === 0 ? (
        <CrmEmpty title="No employee records" icon={<Users className="size-8" aria-hidden />}>
          Add one above to start running payroll and attendance.
        </CrmEmpty>
      ) : (
        <CrmTable
          caption="Employees"
          headers={["Code", "Name", "Role", "Gross", "Deductions", "Status"]}
          minWidth={900}
        >
          {employees.map((e) => {
            const gross =
              Number(e.basic_salary ?? 0) + Number(e.hra ?? 0) +
              Number(e.allowances ?? 0) + Number(e.incentive ?? 0);
            const deductions =
              Number(e.pf_deduction ?? 0) + Number(e.tds_deduction ?? 0) +
              Number(e.other_deductions ?? 0);
            return (
              <tr key={e.id} className="border-t align-top">
                <td className="p-3 font-semibold text-ink tabular-nums">{e.employee_code}</td>
                <td className="p-3">
                  <span className="font-medium text-ink">{e.profile?.full_name ?? "—"}</span>
                  {e.joining_date ? (
                    <span className="block text-sm text-muted-foreground tabular-nums">
                      Joined {e.joining_date}
                    </span>
                  ) : null}
                </td>
                <td className="p-3 text-sm">
                  {e.designation || "—"}
                  {e.department ? (
                    <span className="block text-muted-foreground">{e.department}</span>
                  ) : null}
                </td>
                <td className="p-3 tabular-nums">{formatInr(gross)}</td>
                <td className="p-3 tabular-nums text-muted-foreground">{formatInr(deductions)}</td>
                <td className="p-3">
                  <Badge variant={e.is_active ? "success" : "outline"} size="sm">
                    {e.is_active ? "Active" : "Inactive"}
                  </Badge>
                </td>
              </tr>
            );
          })}
        </CrmTable>
      )}
    </div>
  );
}
