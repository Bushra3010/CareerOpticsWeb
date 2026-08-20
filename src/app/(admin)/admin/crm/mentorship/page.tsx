import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { GraduationCap } from "lucide-react";

import { ActionButton, Disclosure } from "@/components/crm/action-controls";
import { ActionForm } from "@/components/crm/action-form";
import { CRM_CONTROL, CrmEmpty, CrmPageHeader, CrmStat, CrmTable } from "@/components/crm/crm-ui";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  APPROVAL_STATUSES,
  APPROVAL_STATUS_LABELS,
  MENTORSHIP_TASK_TYPES,
  type ApprovalStatus,
} from "@/config/crm";
import { createMentorship, decideMentorship } from "@/app/(admin)/admin/crm/phase2-actions";
import { can, isCrmManager, requireStaff } from "@/lib/auth";
import { listCrmStudents, listMentorships, listStaff } from "@/lib/queries/crm";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Mentorship",
  robots: { index: false, follow: false },
};

const TONE: Record<ApprovalStatus, "secondary" | "success" | "urgent"> = {
  pending: "secondary",
  approved: "success",
  rejected: "urgent",
};

export default async function MentorshipPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const profile = await requireStaff();
  if (!can(profile.role, "leads")) redirect("/admin");

  const manager = isCrmManager(profile.role);
  const params = await searchParams;

  const [rows, staff, students] = await Promise.all([
    listMentorships(params.status),
    listStaff(),
    listCrmStudents({ status: "active" }),
  ]);

  const byId = new Map(staff.map((s) => [s.id, s.full_name ?? "Unnamed"]));
  const pending = rows.filter((r) => r.status === "pending").length;
  const approved = rows.filter((r) => r.status === "approved").length;

  return (
    <div>
      <CrmPageHeader
        title="Mentorship"
        description="Follow-up work assigned to a telecaller for a specific student."
      />

      <dl className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <CrmStat label="Assignments" value={String(rows.length)} />
        <CrmStat label="Awaiting approval" value={String(pending)} tone={pending > 0 ? "urgent" : undefined} />
        <CrmStat label="Approved" value={String(approved)} tone="success" />
      </dl>

      <form className="mt-6 flex flex-wrap items-end gap-3 rounded-xl border bg-card p-4">
        <div className="grid gap-1.5">
          <label htmlFor="m-status" className="text-sm font-medium text-ink">Status</label>
          <select id="m-status" name="status" defaultValue={params.status ?? ""} className={`${CRM_CONTROL} w-[180px]`}>
            <option value="">All</option>
            {APPROVAL_STATUSES.map((s) => (
              <option key={s} value={s}>{APPROVAL_STATUS_LABELS[s]}</option>
            ))}
          </select>
        </div>
        <Button type="submit">Filter</Button>
      </form>

      <div className="mt-6">
        <Disclosure label="Assign mentorship work">
          <ActionForm
            action={createMentorship}
            submitLabel="Assign"
            fields={[
              {
                name: "student_id", label: "Student", type: "select", required: true,
                options: students.students.map((s) => ({
                  value: s.id,
                  label: `${s.full_name} · ${s.enrollment_number}`,
                })),
              },
              {
                name: "telecaller_id", label: "Mentor", type: "select", required: true,
                options: staff.map((s) => ({ value: s.id, label: s.full_name ?? "Unnamed" })),
              },
              {
                name: "task_type", label: "Task", type: "select", required: true,
                options: MENTORSHIP_TASK_TYPES.map((t) => ({ value: t.value, label: t.label })),
              },
              { name: "description", label: "What needs doing", type: "textarea" },
            ]}
          />
        </Disclosure>
      </div>

      {rows.length === 0 ? (
        <CrmEmpty title="Nothing assigned" icon={<GraduationCap className="size-8" aria-hidden />}>
          Assign a student to a mentor above.
        </CrmEmpty>
      ) : (
        <CrmTable
          caption="Mentorship assignments"
          headers={["Student", "Mentor", "Task", "Rating", "Status"]}
          minWidth={900}
        >
          {rows.map((row) => {
            const student = Array.isArray(row.student) ? row.student[0] : row.student;
            const task = MENTORSHIP_TASK_TYPES.find((t) => t.value === row.task_type);
            return (
              <tr key={row.id} className="border-t align-top">
                <td className="p-3">
                  <span className="font-medium text-ink">
                    {(student as { full_name?: string } | null)?.full_name ?? "—"}
                  </span>
                  <span className="block text-sm text-muted-foreground tabular-nums">
                    {(student as { enrollment_number?: string } | null)?.enrollment_number ?? ""}
                  </span>
                </td>
                <td className="p-3 text-sm">
                  {byId.get(row.telecaller_id as string) ?? "—"}
                </td>
                <td className="p-3 text-sm">
                  <span className="text-ink">{task?.label ?? row.task_type}</span>
                  {row.description ? (
                    <span className="block text-muted-foreground">{row.description}</span>
                  ) : null}
                </td>
                <td className="p-3 tabular-nums">
                  {row.rating !== null && row.rating !== undefined ? `${row.rating}/10` : "—"}
                  {row.salary_percentage ? (
                    <span className="block text-sm text-muted-foreground">
                      +{row.salary_percentage}% salary
                    </span>
                  ) : null}
                </td>
                <td className="p-3">
                  <Badge variant={TONE[row.status as ApprovalStatus]} size="sm">
                    {APPROVAL_STATUS_LABELS[row.status as ApprovalStatus]}
                  </Badge>
                  {row.admin_remarks ? (
                    <span className="mt-1 block text-sm text-muted-foreground">
                      {row.admin_remarks}
                    </span>
                  ) : null}
                  {manager && row.status === "pending" ? (
                    <div className="mt-2 flex gap-2">
                      <ActionButton
                        action={decideMentorship}
                        payload={{ id: row.id as string, status: "approved" }}
                      >
                        Approve
                      </ActionButton>
                      <ActionButton
                        action={decideMentorship}
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
