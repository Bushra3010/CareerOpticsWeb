import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { LifeBuoy } from "lucide-react";

import { ActionForm } from "@/components/crm/action-form";
import { Disclosure } from "@/components/crm/action-controls";
import { CRM_CONTROL, CrmEmpty, CrmPageHeader, CrmStat, CrmTable } from "@/components/crm/crm-ui";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { TICKET_STATUSES, TICKET_STATUS_LABELS, type TicketStatus } from "@/config/crm";
import { replyToTicket } from "@/app/(admin)/admin/crm/phase2-actions";
import { isCrmManager, requireStaff } from "@/lib/auth";
import { listSupportTickets } from "@/lib/queries/crm";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Support",
  robots: { index: false, follow: false },
};

const TONE: Record<TicketStatus, "secondary" | "success" | "outline"> = {
  open: "secondary",
  in_progress: "secondary",
  resolved: "success",
  closed: "outline",
};

export default async function SupportPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const profile = await requireStaff();
  if (!isCrmManager(profile.role)) redirect("/admin/crm");

  const params = await searchParams;
  const from = params.from === "student" ? "student_support_tickets" : "associate_support_tickets";
  const tickets = await listSupportTickets(from, params.status);

  const open = tickets.filter((t) => t.status === "open" || t.status === "in_progress").length;

  return (
    <div>
      <CrmPageHeader
        title="Support"
        description="Tickets raised from the associate and student portals."
      />

      <dl className="mt-6 grid gap-4 sm:grid-cols-2">
        <CrmStat label="Tickets" value={String(tickets.length)} />
        <CrmStat label="Still open" value={String(open)} tone={open > 0 ? "urgent" : undefined} />
      </dl>

      <form className="mt-6 flex flex-wrap items-end gap-3 rounded-xl border bg-card p-4">
        <div className="grid gap-1.5">
          <label htmlFor="sp-from" className="text-sm font-medium text-ink">Raised by</label>
          <select id="sp-from" name="from" defaultValue={params.from ?? "associate"} className={`${CRM_CONTROL} w-[170px]`}>
            <option value="associate">Associates</option>
            <option value="student">Students</option>
          </select>
        </div>
        <div className="grid gap-1.5">
          <label htmlFor="sp-status" className="text-sm font-medium text-ink">Status</label>
          <select id="sp-status" name="status" defaultValue={params.status ?? ""} className={`${CRM_CONTROL} w-[170px]`}>
            <option value="">All</option>
            {TICKET_STATUSES.map((s) => (
              <option key={s} value={s}>{TICKET_STATUS_LABELS[s]}</option>
            ))}
          </select>
        </div>
        <Button type="submit">Apply</Button>
      </form>

      {tickets.length === 0 ? (
        <CrmEmpty title="No tickets" icon={<LifeBuoy className="size-8" aria-hidden />}>
          Nothing matches this filter.
        </CrmEmpty>
      ) : (
        <CrmTable
          caption="Support tickets"
          headers={["Raised", "From", "Subject", "Status", "Reply"]}
          minWidth={960}
        >
          {tickets.map((t) => {
            const who = Array.isArray(t.associate) ? t.associate[0] : t.associate;
            const student = Array.isArray(t.student) ? t.student[0] : t.student;
            const name =
              (who as { name?: string } | null)?.name ??
              (student as { full_name?: string } | null)?.full_name ??
              "Unknown";

            return (
              <tr key={t.id} className="border-t align-top">
                <td className="p-3 text-sm text-muted-foreground tabular-nums">
                  {String(t.created_at).slice(0, 10)}
                </td>
                <td className="p-3 text-sm font-medium text-ink">{name}</td>
                <td className="p-3">
                  <span className="font-medium text-ink">{t.subject}</span>
                  <span className="block text-sm text-muted-foreground">{t.message}</span>
                </td>
                <td className="p-3">
                  <Badge variant={TONE[t.status as TicketStatus]} size="sm">
                    {TICKET_STATUS_LABELS[t.status as TicketStatus]}
                  </Badge>
                </td>
                <td className="p-3">
                  {t.admin_reply ? (
                    <p className="mb-2 text-sm text-ink">{t.admin_reply}</p>
                  ) : null}
                  <Disclosure label={t.admin_reply ? "Update reply" : "Reply"}>
                    <ActionForm
                      action={replyToTicket}
                      submitLabel="Send reply"
                      columns={1}
                      hidden={{ id: t.id as string, table: from }}
                      fields={[
                        {
                          name: "status", label: "Status", type: "select", required: true,
                          options: TICKET_STATUSES.map((s) => ({
                            value: s, label: TICKET_STATUS_LABELS[s],
                          })),
                          defaultValue: t.status as string,
                        },
                        {
                          name: "admin_reply", label: "Reply", type: "textarea",
                          defaultValue: (t.admin_reply as string) ?? "",
                        },
                      ]}
                    />
                  </Disclosure>
                </td>
              </tr>
            );
          })}
        </CrmTable>
      )}
    </div>
  );
}
