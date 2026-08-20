import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { CalendarClock } from "lucide-react";

import { ActionSelect } from "@/components/crm/action-controls";
import { AppointmentForm } from "@/components/crm/appointment-form";
import {
  CRM_CONTROL,
  CrmEmpty,
  CrmPageHeader,
  CrmStat,
  CrmTable,
} from "@/components/crm/crm-ui";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  APPOINTMENT_STATUSES,
  APPOINTMENT_STATUS_LABELS,
  type AppointmentStatus,
} from "@/config/crm";
import { setAppointmentStatus } from "@/app/(admin)/admin/crm/phase2-actions";
import { can, requireStaff } from "@/lib/auth";
import { listAppointments, listStaff } from "@/lib/queries/crm";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Appointments",
  robots: { index: false, follow: false },
};

const TONE: Record<AppointmentStatus, "secondary" | "success" | "urgent" | "outline"> = {
  scheduled: "secondary",
  completed: "success",
  cancelled: "outline",
  no_show: "urgent",
};

export default async function AppointmentsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const profile = await requireStaff();
  if (!can(profile.role, "leads")) redirect("/admin");

  const params = await searchParams;
  const today = new Date().toISOString().slice(0, 10);
  const date = params.date ?? today;

  const [appointments, staff] = await Promise.all([
    listAppointments({ date, status: params.status }),
    listStaff(),
  ]);

  const scheduled = appointments.filter((a) => a.status === "scheduled").length;
  const completed = appointments.filter((a) => a.status === "completed").length;
  const noShows = appointments.filter((a) => a.status === "no_show").length;

  return (
    <div>
      <CrmPageHeader
        title="Appointments"
        description="Office visits and Meet calls booked against a lead."
        actions={
          <Button asChild variant="outline">
            <Link href={`/admin/crm/appointments?date=${today}`}>Today</Link>
          </Button>
        }
      />

      <dl className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <CrmStat label="Scheduled" value={String(scheduled)} />
        <CrmStat label="Completed" value={String(completed)} tone="success" />
        <CrmStat label="No shows" value={String(noShows)} tone={noShows > 0 ? "urgent" : undefined} />
      </dl>

      <form className="mt-6 flex flex-wrap items-end gap-3 rounded-xl border bg-card p-4">
        <div className="grid gap-1.5">
          <label htmlFor="a-date" className="text-sm font-medium text-ink">Date</label>
          <input id="a-date" name="date" type="date" defaultValue={date} className={`${CRM_CONTROL} w-[180px]`} />
        </div>
        <div className="grid gap-1.5">
          <label htmlFor="a-status" className="text-sm font-medium text-ink">Status</label>
          <select id="a-status" name="status" defaultValue={params.status ?? ""} className={`${CRM_CONTROL} w-[170px]`}>
            <option value="">All</option>
            {APPOINTMENT_STATUSES.map((s) => (
              <option key={s} value={s}>{APPOINTMENT_STATUS_LABELS[s]}</option>
            ))}
          </select>
        </div>
        <Button type="submit">Show</Button>
      </form>

      <div className="mt-6">
        <AppointmentForm
          staff={staff.map((s) => ({ id: s.id, name: s.full_name ?? "Unnamed" }))}
          defaultDate={date}
        />
      </div>

      {appointments.length === 0 ? (
        <CrmEmpty
          title="Nothing booked"
          icon={<CalendarClock className="size-8" aria-hidden />}
        >
          No appointments on {date}. Book one above — a slot can only be taken once per host.
        </CrmEmpty>
      ) : (
        <CrmTable
          caption={`Appointments on ${date}`}
          headers={["Time", "Lead", "Type", "Notes", "Status"]}
          minWidth={860}
        >
          {appointments.map((a) => {
            // PostgREST types a to-one embed as an array; it only ever holds one row.
            const lead = (Array.isArray(a.lead) ? a.lead[0] : a.lead) as
              | { id: string; full_name: string; phone: string }
              | undefined;
            return (
              <tr key={a.id} className="border-t align-top">
                <td className="p-3 whitespace-nowrap tabular-nums font-semibold text-ink">
                  {String(a.scheduled_time).slice(0, 5)}
                  <span className="block text-sm font-normal text-muted-foreground">
                    {a.scheduled_date}
                  </span>
                </td>
                <td className="p-3">
                  {lead ? (
                    <Link
                      href={`/admin/crm/leads/${lead.id}`}
                      className="font-medium text-ink hover:text-brand-blue"
                    >
                      {lead.full_name}
                      <span className="block text-sm font-normal text-muted-foreground tabular-nums">
                        {lead.phone}
                      </span>
                    </Link>
                  ) : (
                    <span className="text-muted-foreground">Lead removed</span>
                  )}
                </td>
                <td className="p-3">
                  <Badge variant="outline" size="sm">
                    {a.appointment_type === "google_meet" ? "Meet" : "Office"}
                  </Badge>
                  {a.meet_link ? (
                    <a
                      href={a.meet_link}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-1 block text-sm text-brand-blue-400 hover:underline"
                    >
                      Join link
                    </a>
                  ) : null}
                </td>
                <td className="p-3 text-sm text-muted-foreground">
                  {a.notes || "—"}
                  {a.review_note ? (
                    <span className="mt-1 block text-ink">Review: {a.review_note}</span>
                  ) : null}
                </td>
                <td className="p-3">
                  <Badge variant={TONE[a.status as AppointmentStatus]} size="sm">
                    {APPOINTMENT_STATUS_LABELS[a.status as AppointmentStatus]}
                  </Badge>
                  <div className="mt-2">
                    <ActionSelect
                      action={setAppointmentStatus}
                      name="status"
                      value={a.status}
                      hidden={{ id: a.id }}
                      label="Appointment status"
                      options={APPOINTMENT_STATUSES.map((s) => ({
                        value: s,
                        label: APPOINTMENT_STATUS_LABELS[s],
                      }))}
                      confirmOn={["completed"]}
                      confirmPrompt="How did it go? (saved as the review note)"
                      confirmField="review_note"
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
