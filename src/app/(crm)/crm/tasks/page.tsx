import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { CheckSquare } from "lucide-react";

import { ActionForm } from "@/components/crm/action-form";
import { Disclosure } from "@/components/crm/action-controls";
import {
  CRM_CONTROL,
  CrmEmpty,
  CrmPageHeader,
  CrmStat,
  CrmTable,
  CrmTabs,
} from "@/components/crm/crm-ui";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  TASK_STATUSES,
  TASK_STATUS_LABELS,
  TICKET_PRIORITY_LABELS,
  type TaskPriority,
  type TaskStatus,
} from "@/config/crm";
import { createTask, updateTask } from "@/app/(crm)/crm/phase2-actions";
import { can, requireStaff } from "@/lib/auth";
import { listTasks, listStaff } from "@/lib/queries/crm";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Tasks",
  robots: { index: false, follow: false },
};

const STATUS_TONE: Record<TaskStatus, "secondary" | "success" | "outline"> = {
  pending: "secondary",
  in_progress: "secondary",
  done: "success",
};

const PRIORITY_TONE: Record<TaskPriority, "secondary" | "destructive" | "outline" | "default"> = {
  low: "outline",
  normal: "secondary",
  high: "default",
  urgent: "destructive",
};

const TASKS_TABS = [
  { href: "/crm/tasks", label: "All" },
  { href: "/crm/tasks?status=pending", label: "Pending" },
  { href: "/crm/tasks?status=in_progress", label: "In progress" },
  { href: "/crm/tasks?status=done", label: "Done" },
];

export default async function TasksPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const profile = await requireStaff();
  if (!can(profile.role, "leads")) redirect("/crm");

  const params = await searchParams;
  const filterStatus = params.status && TASK_STATUSES.includes(params.status as TaskStatus)
    ? (params.status as TaskStatus)
    : undefined;
  const filterPriority = params.priority && ["low", "normal", "high", "urgent"].includes(params.priority)
    ? (params.priority as TaskPriority)
    : undefined;
  const filterAssigned = params.assignedTo || undefined;

  const [tasks, staff] = await Promise.all([
    listTasks({ status: filterStatus, priority: filterPriority, assignedTo: filterAssigned }),
    listStaff(),
  ]);

  const pending = tasks.filter((t) => t.status === "pending" || t.status === "in_progress").length;
  const overdue = tasks.filter(
    (t) => (t.status === "pending" || t.status === "in_progress") && t.due_date && t.due_date < new Date().toISOString().slice(0, 10),
  ).length;

  return (
    <div>
      <CrmPageHeader
        title="Tasks"
        description="Track and manage work across your team."
      />

      <CrmTabs tabs={TASKS_TABS} current={`/crm/tasks${filterStatus ? `?status=${filterStatus}` : ""}`} />

      <dl className="mt-6 grid gap-4 sm:grid-cols-3">
        <CrmStat label="Total tasks" value={String(tasks.length)} />
        <CrmStat
          label="Still open"
          value={String(pending)}
          tone={pending > 0 ? "urgent" : undefined}
        />
        <CrmStat
          label="Overdue"
          value={String(overdue)}
          tone={overdue > 0 ? "urgent" : undefined}
        />
      </dl>

      <form className="mt-6 flex flex-wrap items-end gap-3 rounded-xl border bg-card p-4">
        <div className="grid gap-1.5">
          <label htmlFor="t-status" className="text-sm font-medium text-ink">Status</label>
          <select id="t-status" name="status" defaultValue={filterStatus ?? ""} className={`${CRM_CONTROL} w-[170px]`}>
            <option value="">All</option>
            {TASK_STATUSES.map((s) => (
              <option key={s} value={s}>{TASK_STATUS_LABELS[s]}</option>
            ))}
          </select>
        </div>
        <div className="grid gap-1.5">
          <label htmlFor="t-priority" className="text-sm font-medium text-ink">Priority</label>
          <select id="t-priority" name="priority" defaultValue={filterPriority ?? ""} className={`${CRM_CONTROL} w-[170px]`}>
            <option value="">All</option>
            <option value="low">{TICKET_PRIORITY_LABELS.low}</option>
            <option value="normal">{TICKET_PRIORITY_LABELS.normal}</option>
            <option value="high">{TICKET_PRIORITY_LABELS.high}</option>
            <option value="urgent">{TICKET_PRIORITY_LABELS.urgent}</option>
          </select>
        </div>
        <div className="grid gap-1.5">
          <label htmlFor="t-assigned" className="text-sm font-medium text-ink">Assigned to</label>
          <select id="t-assigned" name="assignedTo" defaultValue={filterAssigned ?? ""} className={`${CRM_CONTROL} w-[170px]`}>
            <option value="">All</option>
            {staff.map((s) => (
              <option key={s.id} value={s.id}>{s.full_name || s.id}</option>
            ))}
          </select>
        </div>
        <Button type="submit">Apply</Button>
      </form>

      <div className="mt-6">
        <Disclosure label="New task">
          <div className="rounded-xl border bg-card p-5">
            <ActionForm
              action={createTask}
              submitLabel="Create task"
              columns={2}
              fields={[
                {
                  name: "title",
                  label: "Title",
                  type: "text",
                  required: true,
                  placeholder: "What needs to be done?",
                  wide: true,
                },
                {
                  name: "priority",
                  label: "Priority",
                  type: "select",
                  defaultValue: "normal",
                  options: [
                    { value: "low", label: "Low" },
                    { value: "normal", label: "Normal" },
                    { value: "high", label: "High" },
                    { value: "urgent", label: "Urgent" },
                  ],
                },
                {
                  name: "status",
                  label: "Status",
                  type: "select",
                  defaultValue: "pending",
                  options: TASK_STATUSES.map((s) => ({ value: s, label: TASK_STATUS_LABELS[s] })),
                },
                {
                  name: "dueDate",
                  label: "Due date",
                  type: "date",
                },
                {
                  name: "leadId",
                  label: "Lead",
                  type: "select",
                  options: [
                    { value: "", label: "— none —" },
                    { value: "skip", label: "No lead" },
                  ],
                },
                {
                  name: "studentId",
                  label: "Student",
                  type: "select",
                  options: [
                    { value: "", label: "— none —" },
                    { value: "skip", label: "No student" },
                  ],
                },
                {
                  name: "description",
                  label: "Description",
                  type: "textarea",
                  placeholder: "Details, context, instructions…",
                  wide: true,
                },
              ]}
            />
          </div>
        </Disclosure>
      </div>

      {tasks.length === 0 ? (
        <CrmEmpty title="No tasks" icon={<CheckSquare className="size-8" aria-hidden />}>
          Nothing matches this filter.
        </CrmEmpty>
      ) : (
        <CrmTable
          caption="Tasks"
          headers={["Title", "Priority", "Status", "Assigned", "Due", "Related", "Actions"]}
          minWidth={960}
        >
          {tasks.map((t) => (
            <tr key={t.id} className="border-t align-top">
              <td className="p-3">
                <span className="font-medium text-ink">{t.title}</span>
                {t.description ? (
                  <span className="block text-sm text-muted-foreground line-clamp-1">{t.description}</span>
                ) : null}
              </td>
              <td className="p-3">
                <Badge variant={PRIORITY_TONE[t.priority as TaskPriority]} size="sm">
                  {t.priority}
                </Badge>
              </td>
              <td className="p-3">
                <Badge variant={STATUS_TONE[t.status as TaskStatus]} size="sm">
                  {TASK_STATUS_LABELS[t.status as TaskStatus]}
                </Badge>
              </td>
              <td className="p-3 text-sm text-muted-foreground">
                {(t as { assigned_profile?: { full_name: string } | null }).assigned_profile?.full_name ?? "—"}
              </td>
              <td className="p-3 text-sm text-muted-foreground tabular-nums">
                {t.due_date ? (
                  <span className={t.due_date < new Date().toISOString().slice(0, 10) &&
                    (t.status === "pending" || t.status === "in_progress")
                    ? "text-destructive font-medium"
                    : ""}>
                    {t.due_date}
                  </span>
                ) : (
                  "—"
                )}
              </td>
              <td className="p-3 text-sm text-muted-foreground">
                {t.lead_id ? (
                  <span className="text-brand-blue">Lead: {t.lead_id.slice(0, 8)}…</span>
                ) : t.student_id ? (
                  <span className="text-brand-blue">Student: {t.student_id.slice(0, 8)}…</span>
                ) : (
                  "—"
                )}
              </td>
              <td className="p-3">
                <Disclosure label="Edit">
                  <ActionForm
                    action={updateTask}
                    submitLabel="Update task"
                    columns={2}
                    hidden={{ id: t.id as string }}
                    fields={[
                      {
                        name: "title",
                        label: "Title",
                        type: "text",
                        required: true,
                        defaultValue: t.title,
                        wide: true,
                      },
                      {
                        name: "priority",
                        label: "Priority",
                        type: "select",
                        defaultValue: t.priority,
                        options: [
                          { value: "low", label: "Low" },
                          { value: "normal", label: "Normal" },
                          { value: "high", label: "High" },
                          { value: "urgent", label: "Urgent" },
                        ],
                      },
                      {
                        name: "status",
                        label: "Status",
                        type: "select",
                        required: true,
                        defaultValue: t.status,
                        options: TASK_STATUSES.map((s) => ({
                          value: s,
                          label: TASK_STATUS_LABELS[s],
                        })),
                      },
                      {
                        name: "dueDate",
                        label: "Due date",
                        type: "date",
                        defaultValue: t.due_date ?? undefined,
                      },
                      {
                        name: "assignedTo",
                        label: "Assign to",
                        type: "select",
                        defaultValue: t.assigned_to ?? "",
                        options: [
                          { value: "", label: "— unassigned —" },
                          ...staff.map((s) => ({ value: s.id, label: s.full_name || s.id })),
                        ],
                      },
                      {
                        name: "leadId",
                        label: "Linked lead",
                        type: "select",
                        defaultValue: t.lead_id ?? "",
                        options: [
                          { value: "", label: "— none —" },
                          { value: "skip", label: "No lead" },
                        ],
                      },
                      {
                        name: "studentId",
                        label: "Linked student",
                        type: "select",
                        defaultValue: t.student_id ?? "",
                        options: [
                          { value: "", label: "— none —" },
                          { value: "skip", label: "No student" },
                        ],
                      },
                      {
                        name: "description",
                        label: "Description",
                        type: "textarea",
                        defaultValue: t.description ?? "",
                        wide: true,
                      },
                    ]}
                  />
                </Disclosure>
              </td>
            </tr>
          ))}
        </CrmTable>
      )}
    </div>
  );
}
