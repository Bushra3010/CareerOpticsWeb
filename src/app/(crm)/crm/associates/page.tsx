import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { Handshake } from "lucide-react";

import { ActionButton, Disclosure } from "@/components/crm/action-controls";
import { ActionForm } from "@/components/crm/action-form";
import { CRM_CONTROL, CrmEmpty, CrmPageHeader, CrmStat, CrmTable } from "@/components/crm/crm-ui";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  ASSOCIATE_RESOURCE_LABELS,
  ASSOCIATE_RESOURCE_TYPES,
  ASSOCIATE_STATUSES,
  ASSOCIATE_STATUS_LABELS,
  type AssociateStatus,
} from "@/config/crm";
import {
  createAssociate,
  decideRecharge,
  saveResource,
  setAssociateStatus,
} from "@/app/(crm)/crm/phase2-actions";
import { can, isCrmManager, requireStaff } from "@/lib/auth";
import { formatInr } from "@/lib/media";
import {
  listAssociateResources,
  listAssociates,
  listRechargeRequests,
} from "@/lib/queries/crm";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Associates",
  robots: { index: false, follow: false },
};

const TONE: Record<AssociateStatus, "secondary" | "success" | "urgent"> = {
  pending: "secondary",
  approved: "success",
  rejected: "urgent",
};

export default async function AssociatesPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const profile = await requireStaff();
  if (!can(profile.role, "leads")) redirect("/admin");

  const manager = isCrmManager(profile.role);
  const params = await searchParams;

  const [associates, recharges, resources] = await Promise.all([
    listAssociates({ q: params.q, status: params.status }),
    manager ? listRechargeRequests("pending") : Promise.resolve([]),
    listAssociateResources(),
  ]);

  const pending = associates.filter((a) => a.status === "pending").length;
  const approved = associates.filter((a) => a.status === "approved").length;
  const wallet = associates.reduce((sum, a) => sum + Number(a.wallet_balance ?? 0), 0);

  return (
    <div>
      <CrmPageHeader
        title="Associates"
        description="Referral partners, their wallets and the material they can download."
      />

      <dl className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <CrmStat label="Associates" value={String(associates.length)} />
        <CrmStat label="Awaiting approval" value={String(pending)} tone={pending > 0 ? "urgent" : undefined} />
        <CrmStat label="Approved" value={String(approved)} tone="success" />
        <CrmStat label="Wallet float" value={formatInr(wallet) ?? "₹0"} />
      </dl>

      {manager && recharges.length > 0 ? (
        <section className="mt-6 rounded-xl border border-brand-orange/40 bg-card p-5">
          <h2 className="text-h3">Recharge requests</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Approving credits the wallet automatically.
          </p>
          <ul className="mt-4 grid gap-3">
            {recharges.map((r) => {
              const who = Array.isArray(r.associate) ? r.associate[0] : r.associate;
              return (
                <li key={r.id} className="flex flex-wrap items-center justify-between gap-3 rounded-lg border p-3">
                  <span className="text-sm">
                    <span className="font-semibold text-ink">
                      {(who as { name?: string } | null)?.name ?? "Unknown"}
                    </span>
                    <span className="ml-2 tabular-nums text-muted-foreground">
                      {formatInr(Number(r.amount ?? 0))}
                    </span>
                    {r.receipt_url ? (
                      <a
                        href={r.receipt_url}
                        target="_blank"
                        rel="noreferrer"
                        className="ml-2 text-brand-blue-400 hover:underline"
                      >
                        Receipt
                      </a>
                    ) : null}
                  </span>
                  <span className="flex gap-2">
                    <ActionButton action={decideRecharge} payload={{ id: r.id as string, status: "approved" }}>
                      Approve
                    </ActionButton>
                    <ActionButton
                      action={decideRecharge}
                      payload={{ id: r.id as string, status: "rejected", rejection_reason: "Not verified" }}
                      variant="ghost"
                    >
                      Reject
                    </ActionButton>
                  </span>
                </li>
              );
            })}
          </ul>
        </section>
      ) : null}

      <form className="mt-6 flex flex-wrap items-end gap-3 rounded-xl border bg-card p-4">
        <div className="grid gap-1.5">
          <label htmlFor="as-q" className="text-sm font-medium text-ink">Search</label>
          <input id="as-q" name="q" defaultValue={params.q ?? ""}
            placeholder="Name, phone, email or code"
            className={`${CRM_CONTROL} w-[240px]`} />
        </div>
        <div className="grid gap-1.5">
          <label htmlFor="as-status" className="text-sm font-medium text-ink">Status</label>
          <select id="as-status" name="status" defaultValue={params.status ?? ""} className={`${CRM_CONTROL} w-[170px]`}>
            <option value="">All</option>
            {ASSOCIATE_STATUSES.map((s) => (
              <option key={s} value={s}>{ASSOCIATE_STATUS_LABELS[s]}</option>
            ))}
          </select>
        </div>
        <Button type="submit">Apply</Button>
      </form>

      {manager ? (
        <div className="mt-6 grid gap-4 lg:grid-cols-2">
          <Disclosure label="Register an associate">
            <ActionForm
              action={createAssociate}
              submitLabel="Register"
              fields={[
                { name: "name", label: "Name", required: true },
                { name: "phone", label: "Phone", type: "tel", required: true },
                { name: "email", label: "Email", type: "email", required: true },
                { name: "father_phone", label: "Alternate phone", type: "tel" },
                { name: "associate_code", label: "Associate code", help: "Leave blank to assign later." },
                { name: "institution_name", label: "Institution" },
                { name: "city", label: "City" },
                { name: "district", label: "District" },
                { name: "state", label: "State" },
                { name: "pan_number", label: "PAN" },
                { name: "bank_name", label: "Bank" },
                { name: "account_number", label: "Account no." },
                { name: "ifsc_code", label: "IFSC" },
                { name: "account_holder_name", label: "Account holder" },
              ]}
            />
          </Disclosure>

          <Disclosure label="Publish a resource">
            <ActionForm
              action={saveResource}
              submitLabel="Publish"
              columns={1}
              fields={[
                { name: "title", label: "Title", required: true },
                {
                  name: "type", label: "Type", type: "select", required: true,
                  options: ASSOCIATE_RESOURCE_TYPES.map((t) => ({
                    value: t, label: ASSOCIATE_RESOURCE_LABELS[t],
                  })),
                },
                { name: "url", label: "File URL", type: "url", required: true },
                { name: "description", label: "Description", type: "textarea" },
              ]}
            />
            {resources.length > 0 ? (
              <ul className="mt-4 grid gap-1 text-sm">
                {resources.slice(0, 8).map((r) => (
                  <li key={r.id} className="flex items-center justify-between gap-3">
                    <a href={r.url} target="_blank" rel="noreferrer" className="text-brand-blue-400 hover:underline">
                      {r.title}
                    </a>
                    <Badge variant="outline" size="sm">
                      {ASSOCIATE_RESOURCE_LABELS[r.type as keyof typeof ASSOCIATE_RESOURCE_LABELS] ?? r.type}
                    </Badge>
                  </li>
                ))}
              </ul>
            ) : null}
          </Disclosure>
        </div>
      ) : null}

      {associates.length === 0 ? (
        <CrmEmpty title="No associates" icon={<Handshake className="size-8" aria-hidden />}>
          {manager ? "Register one above." : "Nothing matches this filter."}
        </CrmEmpty>
      ) : (
        <CrmTable
          caption="Associates"
          headers={["Associate", "Institution", "Wallet", "Status", ""]}
          minWidth={900}
        >
          {associates.map((a) => (
            <tr key={a.id} className="border-t align-top">
              <td className="p-3">
                <Link
                  href={`/crm/associates/${a.id}`}
                  className="font-medium text-ink hover:text-brand-blue"
                >
                  {a.name}
                </Link>
                <span className="block text-sm text-muted-foreground tabular-nums">{a.phone}</span>
                {a.associate_code ? (
                  <span className="block text-sm text-muted-foreground">{a.associate_code}</span>
                ) : null}
              </td>
              <td className="p-3 text-sm">
                {a.institution_name || "—"}
                <span className="block text-muted-foreground">
                  {[a.city, a.district, a.state].filter(Boolean).join(", ")}
                </span>
              </td>
              <td className="p-3 tabular-nums">{formatInr(Number(a.wallet_balance ?? 0))}</td>
              <td className="p-3">
                <Badge variant={TONE[a.status as AssociateStatus]} size="sm">
                  {ASSOCIATE_STATUS_LABELS[a.status as AssociateStatus]}
                </Badge>
                {a.rejection_reason ? (
                  <span className="mt-1 block text-sm text-muted-foreground">{a.rejection_reason}</span>
                ) : null}
              </td>
              <td className="p-3">
                {manager && a.status === "pending" ? (
                  <div className="flex gap-2">
                    <ActionButton
                      action={setAssociateStatus}
                      payload={{ id: a.id as string, status: "approved" }}
                    >
                      Approve
                    </ActionButton>
                    <ActionButton
                      action={setAssociateStatus}
                      payload={{
                        id: a.id as string,
                        status: "rejected",
                        rejection_reason: "Documents not verified",
                      }}
                      variant="ghost"
                    >
                      Reject
                    </ActionButton>
                  </div>
                ) : null}
              </td>
            </tr>
          ))}
        </CrmTable>
      )}
    </div>
  );
}
