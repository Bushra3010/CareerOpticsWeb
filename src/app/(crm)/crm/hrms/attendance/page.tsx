import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { ActionSelect } from "@/components/crm/action-controls";
import { CRM_CONTROL, CrmEmpty, CrmPageHeader, CrmStat, CrmTable, CrmTabs, HRMS_TABS } from "@/components/crm/crm-ui";
import { Button } from "@/components/ui/button";
import { ATTENDANCE_STATUSES, ATTENDANCE_STATUS_LABELS } from "@/config/crm";
import { markAttendance } from "@/app/(crm)/crm/phase2-actions";
import { isCrmManager, requireStaff } from "@/lib/auth";
import { getAttendance, listEmployees } from "@/lib/queries/crm";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Attendance",
  robots: { index: false, follow: false },
};

export default async function AttendancePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const profile = await requireStaff();
  if (!isCrmManager(profile.role)) redirect("/crm");

  const params = await searchParams;
  const date = params.date ?? new Date().toISOString().slice(0, 10);

  const [employees, marked] = await Promise.all([listEmployees(), getAttendance(date)]);

  const counts = { present: 0, absent: 0, unmarked: 0 };
  for (const e of employees) {
    const row = marked.get(e.id as string);
    if (!row) counts.unmarked += 1;
    else if (row.status === "absent") counts.absent += 1;
    else counts.present += 1;
  }

  return (
    <div>
      <CrmPageHeader title="Attendance" description="One row per employee for the chosen day." />
      <CrmTabs tabs={HRMS_TABS} current="/crm/hrms/attendance" />

      <dl className="mt-6 grid gap-4 sm:grid-cols-3">
        <CrmStat label="Marked in" value={String(counts.present)} tone="success" />
        <CrmStat label="Absent" value={String(counts.absent)} />
        <CrmStat label="Not yet marked" value={String(counts.unmarked)}
          tone={counts.unmarked > 0 ? "urgent" : undefined} />
      </dl>

      <form className="mt-6 flex flex-wrap items-end gap-3 rounded-xl border bg-card p-4">
        <div className="grid gap-1.5">
          <label htmlFor="at-date" className="text-sm font-medium text-ink">Date</label>
          <input id="at-date" name="date" type="date" defaultValue={date} className={`${CRM_CONTROL} w-[180px]`} />
        </div>
        <Button type="submit">Show</Button>
      </form>

      {employees.length === 0 ? (
        <CrmEmpty title="No employees">Add employee records first.</CrmEmpty>
      ) : (
        <CrmTable
          caption={`Attendance for ${date}`}
          headers={["Code", "Employee", "Status", "Notes"]}
          minWidth={760}
        >
          {employees.map((e) => {
            const row = marked.get(e.id as string);
            return (
              <tr key={e.id} className="border-t align-top">
                <td className="p-3 font-semibold text-ink tabular-nums">{e.employee_code}</td>
                <td className="p-3">
                  <span className="font-medium text-ink">{e.profile?.full_name ?? "—"}</span>
                  {e.designation ? (
                    <span className="block text-sm text-muted-foreground">{e.designation}</span>
                  ) : null}
                </td>
                <td className="p-3">
                  <ActionSelect
                    action={markAttendance}
                    name="status"
                    // "" is not a valid status; it renders the unmarked state
                    // without inventing a sixth enum member for it.
                    value={row?.status ?? ""}
                    hidden={{ employee_id: e.id as string, date }}
                    label={`Attendance for ${e.profile?.full_name ?? e.employee_code}`}
                    width={160}
                    options={[
                      // Shows the unmarked state without being a choice —
                      // "" is not a valid status and the action would reject it.
                      { value: "", label: "Not marked", disabled: true },
                      ...ATTENDANCE_STATUSES.map((s) => ({
                        value: s, label: ATTENDANCE_STATUS_LABELS[s],
                      })),
                    ]}
                  />
                </td>
                <td className="p-3 text-sm text-muted-foreground">
                  {row?.notes || "—"}
                  {row?.clock_in ? (
                    <span className="block tabular-nums">
                      In {String(row.clock_in).slice(0, 5)}
                      {row.clock_out ? ` · Out ${String(row.clock_out).slice(0, 5)}` : ""}
                    </span>
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
