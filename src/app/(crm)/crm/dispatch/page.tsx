import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { Truck } from "lucide-react";

import { ActionSelect, Disclosure } from "@/components/crm/action-controls";
import { ActionForm } from "@/components/crm/action-form";
import { CRM_CONTROL, CrmEmpty, CrmPageHeader, CrmStat, CrmTable } from "@/components/crm/crm-ui";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DISPATCH_DIRECTIONS,
  DISPATCH_STATUSES,
  DISPATCH_STATUS_LABELS,
  type DispatchStatus,
} from "@/config/crm";
import { createDispatch, setDispatchStatus } from "@/app/(crm)/crm/phase2-actions";
import { can, requireStaff } from "@/lib/auth";
import { listDispatches } from "@/lib/queries/crm";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Dispatch",
  robots: { index: false, follow: false },
};

const TONE: Record<DispatchStatus, "secondary" | "success" | "urgent" | "outline"> = {
  pending: "secondary",
  dispatched: "secondary",
  in_transit: "secondary",
  delivered: "success",
  returned: "urgent",
  failed: "urgent",
};

export default async function DispatchPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const profile = await requireStaff();
  if (!can(profile.role, "leads")) redirect("/admin");

  const params = await searchParams;
  const rows = await listDispatches({
    q: params.q,
    status: params.status,
    direction: params.direction,
  });

  const open = rows.filter((r) => !["delivered", "returned", "failed"].includes(r.status)).length;
  const delivered = rows.filter((r) => r.status === "delivered").length;
  const problems = rows.filter((r) => ["returned", "failed"].includes(r.status)).length;

  return (
    <div>
      <CrmPageHeader
        title="Dispatch"
        description="Documents going out to students and coming in from boards."
      />

      <dl className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <CrmStat label="In flight" value={String(open)} />
        <CrmStat label="Delivered" value={String(delivered)} tone="success" />
        <CrmStat label="Returned or failed" value={String(problems)} tone={problems > 0 ? "urgent" : undefined} />
      </dl>

      <form className="mt-6 flex flex-wrap items-end gap-3 rounded-xl border bg-card p-4">
        <div className="grid gap-1.5">
          <label htmlFor="d-q" className="text-sm font-medium text-ink">Search</label>
          <input id="d-q" name="q" defaultValue={params.q ?? ""}
            placeholder="Name, enrollment or tracking no."
            className={`${CRM_CONTROL} w-[240px]`} />
        </div>
        <div className="grid gap-1.5">
          <label htmlFor="d-status" className="text-sm font-medium text-ink">Status</label>
          <select id="d-status" name="status" defaultValue={params.status ?? ""} className={`${CRM_CONTROL} w-[160px]`}>
            <option value="">All</option>
            {DISPATCH_STATUSES.map((s) => (
              <option key={s} value={s}>{DISPATCH_STATUS_LABELS[s]}</option>
            ))}
          </select>
        </div>
        <div className="grid gap-1.5">
          <label htmlFor="d-dir" className="text-sm font-medium text-ink">Direction</label>
          <select id="d-dir" name="direction" defaultValue={params.direction ?? ""} className={`${CRM_CONTROL} w-[160px]`}>
            <option value="">Both</option>
            {DISPATCH_DIRECTIONS.map((d) => (
              <option key={d.value} value={d.value}>{d.value === "inbound" ? "Inbound" : "Outbound"}</option>
            ))}
          </select>
        </div>
        <Button type="submit">Apply</Button>
      </form>

      <div className="mt-6">
        <Disclosure label="Record a dispatch">
          <ActionForm
            action={createDispatch}
            submitLabel="Save dispatch"
            fields={[
              { name: "student_name", label: "Student name", required: true },
              { name: "enrollment_number", label: "Enrollment no." },
              { name: "student_phone", label: "Phone", type: "tel" },
              { name: "father_name", label: "Father's name" },
              {
                name: "document_type", label: "Document", required: true,
                placeholder: "Marksheet, ID card, certificate…",
                defaultValue: "marksheet",
              },
              {
                name: "dispatch_type", label: "Direction", type: "select", required: true,
                options: DISPATCH_DIRECTIONS.map((d) => ({ value: d.value, label: d.label })),
                defaultValue: "outbound",
              },
              { name: "courier", label: "Courier" },
              { name: "tracking_number", label: "Tracking no." },
              { name: "dispatch_date", label: "Sent on", type: "date" },
              { name: "expected_delivery", label: "Expected delivery", type: "date" },
              { name: "remarks", label: "Remarks", type: "textarea" },
            ]}
          />
        </Disclosure>
      </div>

      {rows.length === 0 ? (
        <CrmEmpty title="Nothing to track" icon={<Truck className="size-8" aria-hidden />}>
          Record a dispatch above to start tracking it.
        </CrmEmpty>
      ) : (
        <CrmTable
          caption="Dispatches"
          headers={["Student", "Document", "Courier", "Dates", "Status"]}
          minWidth={940}
        >
          {rows.map((row) => (
            <tr key={row.id} className="border-t align-top">
              <td className="p-3">
                <span className="font-medium text-ink">{row.student_name}</span>
                {row.enrollment_number ? (
                  <span className="block text-sm text-muted-foreground tabular-nums">
                    {row.enrollment_number}
                  </span>
                ) : null}
                {row.student_phone ? (
                  <span className="block text-sm text-muted-foreground tabular-nums">
                    {row.student_phone}
                  </span>
                ) : null}
              </td>
              <td className="p-3">
                <span className="text-ink">{row.document_type}</span>
                <Badge variant="outline" size="sm" className="mt-1 block w-fit">
                  {row.dispatch_type === "inbound" ? "Inbound" : "Outbound"}
                </Badge>
              </td>
              <td className="p-3 text-sm">
                {row.courier || "—"}
                {row.tracking_number ? (
                  <span className="block text-muted-foreground tabular-nums">
                    {row.tracking_number}
                  </span>
                ) : null}
              </td>
              <td className="p-3 text-sm text-muted-foreground tabular-nums">
                {row.dispatch_date ? <>Sent {row.dispatch_date}<br /></> : null}
                {row.expected_delivery ? <>Due {row.expected_delivery}</> : null}
                {!row.dispatch_date && !row.expected_delivery ? "—" : null}
              </td>
              <td className="p-3">
                <Badge variant={TONE[row.status as DispatchStatus]} size="sm">
                  {DISPATCH_STATUS_LABELS[row.status as DispatchStatus]}
                </Badge>
                <div className="mt-2">
                  <ActionSelect
                    action={setDispatchStatus}
                    name="status"
                    value={row.status}
                    hidden={{ id: row.id }}
                    label="Dispatch status"
                    options={DISPATCH_STATUSES.map((s) => ({
                      value: s, label: DISPATCH_STATUS_LABELS[s],
                    }))}
                  />
                </div>
              </td>
            </tr>
          ))}
        </CrmTable>
      )}
    </div>
  );
}
