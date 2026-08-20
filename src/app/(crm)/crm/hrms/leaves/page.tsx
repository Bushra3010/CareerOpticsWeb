import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { CalendarOff } from "lucide-react";

import { ActionButton, Disclosure } from "@/components/crm/action-controls";
import { ActionForm } from "@/components/crm/action-form";
import { CRM_CONTROL, CrmEmpty, CrmPageHeader, CrmStat, CrmTable, CrmTabs, HRMS_TABS } from "@/components/crm/crm-ui";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  APPROVAL_STATUSES,
  APPROVAL_STATUS_LABELS,
  LEAVE_TYPES,
  LEAVE_TYPE_LABELS,
  type ApprovalStatus,
} from "@/config/crm";
import { decideLeave, requestLeave } from "@/app/(crm)/crm/phase2-actions";
import { isCrmManager, requireStaff } from "@/lib/auth";
import { listEmployees, listLeaveRequests } from "@/lib/queries/crm";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Leave",
  robots: { index: false, follow: false },
};

const TONE: Record<ApprovalStatus, "secondary" | "success" | "urgent"> = {
  pending: "secondary",
  approved: "success",
  rejected: "urgent",
};

/** Days between two ISO dates, inclusive of both ends. */
function spanDays(from: string, to: string) {
  const ms = Date.parse(`${to}T00:00:00Z`) - Date.parse(`${from}T00:00:00Z`);
  return Math.max(1, Math.round(ms / 86400_000) + 1);
}

export default async function LeavesPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const profile = await requireStaff();
  if (!isCrmManager(profile.role)) redirect("/crm");

  const params = await searchParams;
  const [rows, employees] = await Promise.all([
    listLeaveRequests(params.status),
    listEmployees(),
  ]);

  const byId = new Map(employees.map((e) => [e.id as string, e]));
  const pending = rows.filter((r) => r.status === "pending").length;
  const approved = rows.filter((r) => r.status === "approved").length;

  return (
    <div>
      <CrmPageHeader title="Leave" description="Requests waiting on a decision, and what has been decided." />
      <CrmTabs tabs={HRMS_TABS} current="/crm/hrms/leaves" />

      <dl className="mt-6 grid gap-4 sm:grid-cols-3">
        <CrmStat label="Requests" value={String(rows.length)} />
        <CrmStat label="Awaiting decision" value={String(pending)} tone={pending > 0 ? "urgent" : undefined} />
        <CrmStat label="Approved" value={String(approved)} tone="success" />
      </dl>

      <form className="mt-6 flex flex-wrap items-end gap-3 rounded-xl border bg-card p-4">
        <div className="grid gap-1.5">
          <label htmlFor="lv-status" className="text-sm font-medium text-ink">Status</label>
          <select id="lv-status" name="status" defaultValue={params.status ?? ""} className={`${CRM_CONTROL} w-[180px]`}>
            <option value="">All</option>
            {APPROVAL_STATUSES.map((s) => (
              <option key={s} value={s}>{APPROVAL_STATUS_LABELS[s]}</option>
            ))}
          </select>
        </div>
        <Button type="submit">Filter</Button>
      </form>

      <div className="mt-6">
        <Disclosure label="Record a leave request">
          <ActionForm
            action={requestLeave}
            submitLabel="Submit request"
            fields={[
              {
                name: "employee_id", label: "Employee", type: "select", required: true,
                options: employees.map((e) => ({
                  value: e.id as string,
                  label: `${e.profile?.full_name ?? "Unnamed"} · ${e.employee_code}`,
                })),
              },
              {
                name: "leave_type", label: "Type", type: "select", required: true,
                options: LEAVE_TYPES.map((t) => ({ value: t, label: LEAVE_TYPE_LABELS[t] })),
              },
              { name: "from_date", label: "From", type: "date", required: true },
              { name: "to_date", label: "To", type: "date", required: true },
              { name: "reason", label: "Reason", type: "textarea" },
            ]}
          />
        </Disclosure>
      </div>

      {rows.length === 0 ? (
        <CrmEmpty title="No leave requests" icon={<CalendarOff className="size-8" aria-hidden />}>
          Nothing matches this filter.
        </CrmEmpty>
      ) : (
        <CrmTable
          caption="Leave requests"
          headers={["Employee", "Type", "Dates", "Reason", "Status"]}
          minWidth={880}
        >
          {rows.map((row) => {
            const employee = byId.get(row.employee_id as string);
            const days = spanDays(row.from_date as string, row.to_date as string);
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
                <td className="p-3 text-sm">
                  {LEAVE_TYPE_LABELS[row.leave_type as keyof typeof LEAVE_TYPE_LABELS] ?? row.leave_type}
                </td>
                <td className="p-3 text-sm tabular-nums">
                  {row.from_date} → {row.to_date}
                  <span className="block text-muted-foreground">
                    {days} day{days === 1 ? "" : "s"}
                  </span>
                </td>
                <td className="p-3 text-sm text-muted-foreground">{row.reason || "—"}</td>
                <td className="p-3">
                  <Badge variant={TONE[row.status as ApprovalStatus]} size="sm">
                    {APPROVAL_STATUS_LABELS[row.status as ApprovalStatus]}
                  </Badge>
                  {row.status === "pending" ? (
                    <div className="mt-2 flex gap-2">
                      <ActionButton action={decideLeave} payload={{ id: row.id as string, status: "approved" }}>
                        Approve
                      </ActionButton>
                      <ActionButton
                        action={decideLeave}
                        payload={{ id: row.id as string, status: "rejected" }}
                        variant="ghost"
                      >
                        Reject
                      </ActionButton>
                    </div>
                  ) : null}
                </td>
              </tr>
            );
          })}
        </CrmTable>
      )}
    </div>
  );
}
