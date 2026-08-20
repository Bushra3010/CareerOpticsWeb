import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { Scale } from "lucide-react";

import { Disclosure } from "@/components/crm/action-controls";
import { ActionForm } from "@/components/crm/action-form";
import { CRM_CONTROL, CrmEmpty, CrmPageHeader, CrmStat, CrmTable } from "@/components/crm/crm-ui";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { saveLitigation } from "@/app/(admin)/admin/crm/phase2-actions";
import { can, isCrmManager, requireStaff } from "@/lib/auth";
import { formatInr } from "@/lib/media";
import { getSettingsData, listLitigations } from "@/lib/queries/crm";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Litigation",
  robots: { index: false, follow: false },
};

/** Money a department is owed and chasing, per student. */
export default async function LitigationPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const profile = await requireStaff();
  if (!can(profile.role, "leads")) redirect("/admin");
  if (!isCrmManager(profile.role)) redirect("/admin/crm");

  const params = await searchParams;
  const [rows, settings] = await Promise.all([
    listLitigations(params.department),
    getSettingsData(),
  ]);

  const owed = rows.reduce(
    (sum, r) => sum + Math.max(0, Number(r.litigation_amount ?? 0) - Number(r.amount_paid ?? 0)),
    0,
  );
  const recovered = rows.reduce((sum, r) => sum + Number(r.amount_paid ?? 0), 0);
  const settled = rows.filter(
    (r) => Number(r.amount_paid ?? 0) >= Number(r.litigation_amount ?? 0),
  ).length;

  return (
    <div>
      <CrmPageHeader
        title="Litigation"
        description="Outstanding department dues being chased, and what has come back."
      />

      <dl className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <CrmStat label="Cases" value={String(rows.length)} />
        <CrmStat label="Still owed" value={formatInr(owed) ?? "₹0"} tone={owed > 0 ? "urgent" : undefined} />
        <CrmStat label="Recovered" value={formatInr(recovered) ?? "₹0"} tone="success" />
        <CrmStat label="Settled" value={`${settled} of ${rows.length}`} />
      </dl>

      <form className="mt-6 flex flex-wrap items-end gap-3 rounded-xl border bg-card p-4">
        <div className="grid gap-1.5">
          <label htmlFor="l-dept" className="text-sm font-medium text-ink">Department</label>
          <select id="l-dept" name="department" defaultValue={params.department ?? ""} className={`${CRM_CONTROL} w-[220px]`}>
            <option value="">All departments</option>
            {settings.departments.map((d) => (
              <option key={d.id} value={d.id}>{d.name}</option>
            ))}
          </select>
        </div>
        <Button type="submit">Filter</Button>
      </form>

      <div className="mt-6">
        <Disclosure label="Record a case">
          <ActionForm
            action={saveLitigation}
            submitLabel="Save case"
            fields={[
              {
                name: "department_id", label: "Department", type: "select", required: true,
                options: settings.departments.map((d) => ({ value: d.id, label: d.name })),
              },
              {
                name: "session_id", label: "Session", type: "select",
                options: settings.sessions.map((s) => ({ value: s.id, label: s.name })),
              },
              { name: "student_name", label: "Student", required: true },
              { name: "father_name", label: "Father's name" },
              { name: "phone", label: "Phone", type: "tel" },
              { name: "litigation_amount", label: "Amount owed (₹)", type: "number", step: "any", min: "0", required: true },
              { name: "amount_paid", label: "Recovered so far (₹)", type: "number", step: "any", min: "0", defaultValue: 0 },
              { name: "notes", label: "Notes", type: "textarea" },
            ]}
          />
        </Disclosure>
      </div>

      {rows.length === 0 ? (
        <CrmEmpty title="No cases" icon={<Scale className="size-8" aria-hidden />}>
          Nothing outstanding for this filter.
        </CrmEmpty>
      ) : (
        <CrmTable
          caption="Litigation cases"
          headers={["Student", "Department", "Owed", "Recovered", "Balance"]}
          minWidth={880}
        >
          {rows.map((row) => {
            const dept = Array.isArray(row.department) ? row.department[0] : row.department;
            const session = Array.isArray(row.session) ? row.session[0] : row.session;
            const balance = Math.max(
              0,
              Number(row.litigation_amount ?? 0) - Number(row.amount_paid ?? 0),
            );
            return (
              <tr key={row.id} className="border-t align-top">
                <td className="p-3">
                  <span className="font-medium text-ink">{row.student_name}</span>
                  {row.father_name ? (
                    <span className="block text-sm text-muted-foreground">
                      s/o {row.father_name}
                    </span>
                  ) : null}
                  {row.phone ? (
                    <span className="block text-sm text-muted-foreground tabular-nums">
                      {row.phone}
                    </span>
                  ) : null}
                </td>
                <td className="p-3 text-sm">
                  {(dept as { name?: string } | null)?.name ?? "—"}
                  {(session as { name?: string } | null)?.name ? (
                    <span className="block text-muted-foreground">
                      {(session as { name?: string }).name}
                    </span>
                  ) : null}
                </td>
                <td className="p-3 tabular-nums">{formatInr(Number(row.litigation_amount ?? 0))}</td>
                <td className="p-3 tabular-nums">{formatInr(Number(row.amount_paid ?? 0))}</td>
                <td className="p-3">
                  {balance === 0 ? (
                    <Badge variant="success" size="sm">Settled</Badge>
                  ) : (
                    <span className="font-semibold text-brand-orange tabular-nums">
                      {formatInr(balance)}
                    </span>
                  )}
                </td>
              </tr>
            );
          })}
        </CrmTable>
      )}
    </div>
  );
}
