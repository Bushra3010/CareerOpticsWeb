import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { ArrowLeft } from "lucide-react";

import { ActionForm } from "@/components/crm/action-form";
import { CrmPageHeader, CrmSection, CrmStat, CrmTable } from "@/components/crm/crm-ui";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  ASSOCIATE_STATUS_LABELS,
  TICKET_STATUSES,
  TICKET_STATUS_LABELS,
  type AssociateStatus,
} from "@/config/crm";
import { recordWalletTxn } from "@/app/(admin)/admin/crm/phase2-actions";
import { can, isCrmManager, requireStaff } from "@/lib/auth";
import { formatInr } from "@/lib/media";
import { getAssociate, getAssociateDetail } from "@/lib/queries/crm";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Associate",
  robots: { index: false, follow: false },
};

export default async function AssociateDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const profile = await requireStaff();
  if (!can(profile.role, "leads")) redirect("/admin");

  const { id } = await params;
  const associate = await getAssociate(id);
  if (!associate) notFound();

  const manager = isCrmManager(profile.role);
  const detail = await getAssociateDetail(id);

  const credited = detail.wallet
    .filter((t) => t.type === "credit")
    .reduce((sum, t) => sum + Number(t.amount ?? 0), 0);
  const debited = detail.wallet
    .filter((t) => t.type === "debit")
    .reduce((sum, t) => sum + Number(t.amount ?? 0), 0);

  return (
    <div>
      <Button asChild variant="ghost" size="sm" className="mb-3">
        <Link href="/admin/crm/associates"><ArrowLeft />All associates</Link>
      </Button>

      <CrmPageHeader
        title={associate.name as string}
        description={[associate.phone, associate.email].filter(Boolean).join(" · ")}
        actions={
          <Badge variant={associate.status === "approved" ? "success" : "secondary"}>
            {ASSOCIATE_STATUS_LABELS[associate.status as AssociateStatus]}
          </Badge>
        }
      />

      <dl className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <CrmStat label="Wallet balance" value={formatInr(Number(associate.wallet_balance ?? 0)) ?? "₹0"} />
        <CrmStat label="Credited" value={formatInr(credited) ?? "₹0"} tone="success" />
        <CrmStat label="Debited" value={formatInr(debited) ?? "₹0"} />
        <CrmStat label="Open tickets" value={String(detail.tickets.filter((t) => t.status === "open").length)} />
      </dl>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <CrmSection title="Details">
          <dl className="grid gap-2 text-sm sm:grid-cols-2">
            <Row label="Associate code" value={associate.associate_code} />
            <Row label="Institution" value={associate.institution_name} />
            <Row label="City" value={associate.city} />
            <Row label="District" value={associate.district} />
            <Row label="State" value={associate.state} />
            <Row label="Coordinator" value={associate.coordinator_name} />
            <Row label="PAN" value={associate.pan_number} />
            <Row label="Bank" value={associate.bank_name} />
            <Row label="Account" value={associate.account_number} />
            <Row label="IFSC" value={associate.ifsc_code} />
          </dl>
        </CrmSection>

        {manager ? (
          <CrmSection
            title="Move the wallet"
            description="The balance is recomputed from the ledger, never incremented."
          >
            <ActionForm
              action={recordWalletTxn}
              submitLabel="Record"
              hidden={{ associate_id: id }}
              fields={[
                {
                  name: "type", label: "Direction", type: "select", required: true,
                  options: [
                    { value: "credit", label: "Credit — add to wallet" },
                    { value: "debit", label: "Debit — take from wallet" },
                  ],
                },
                { name: "amount", label: "Amount (₹)", type: "number", step: "any", min: "1", required: true },
                { name: "reason", label: "Reason", wide: true },
              ]}
            />
          </CrmSection>
        ) : null}
      </div>

      {detail.wallet.length > 0 ? (
        <CrmTable caption="Wallet ledger" headers={["When", "Type", "Amount", "Reason"]} minWidth={640}>
          {detail.wallet.map((t) => (
            <tr key={t.id} className="border-t">
              <td className="p-3 text-sm text-muted-foreground tabular-nums">
                {String(t.created_at).slice(0, 10)}
              </td>
              <td className="p-3">
                <Badge variant={t.type === "credit" ? "success" : "outline"} size="sm">
                  {t.type === "credit" ? "Credit" : "Debit"}
                </Badge>
              </td>
              <td className="p-3 tabular-nums">{formatInr(Number(t.amount ?? 0))}</td>
              <td className="p-3 text-sm text-muted-foreground">{t.reason || "—"}</td>
            </tr>
          ))}
        </CrmTable>
      ) : null}

      {detail.tickets.length > 0 ? (
        <CrmTable caption="Support tickets" headers={["Raised", "Subject", "Status", "Reply"]} minWidth={720}>
          {detail.tickets.map((t) => (
            <tr key={t.id} className="border-t align-top">
              <td className="p-3 text-sm text-muted-foreground tabular-nums">
                {String(t.created_at).slice(0, 10)}
              </td>
              <td className="p-3">
                <span className="font-medium text-ink">{t.subject}</span>
                <span className="block text-sm text-muted-foreground">{t.message}</span>
              </td>
              <td className="p-3">
                <Badge
                  variant={t.status === "resolved" || t.status === "closed" ? "success" : "secondary"}
                  size="sm"
                >
                  {TICKET_STATUS_LABELS[t.status as (typeof TICKET_STATUSES)[number]] ?? t.status}
                </Badge>
              </td>
              <td className="p-3 text-sm text-muted-foreground">{t.admin_reply || "—"}</td>
            </tr>
          ))}
        </CrmTable>
      ) : null}

      {detail.dispatches.length > 0 ? (
        <CrmTable caption="Kit dispatches" headers={["Item", "Qty", "Tracking", "Status"]} minWidth={620}>
          {detail.dispatches.map((d) => (
            <tr key={d.id} className="border-t">
              <td className="p-3 text-ink">{d.item_name}</td>
              <td className="p-3 tabular-nums">{d.quantity}</td>
              <td className="p-3 text-sm text-muted-foreground tabular-nums">
                {d.tracking_number || "—"}
              </td>
              <td className="p-3">
                <Badge variant={d.status === "delivered" ? "success" : "secondary"} size="sm">
                  {d.status}
                </Badge>
              </td>
            </tr>
          ))}
        </CrmTable>
      ) : null}
    </div>
  );
}

function Row({ label, value }: { label: string; value: unknown }) {
  return (
    <div>
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="font-medium text-ink">{(value as string) || "—"}</dd>
    </div>
  );
}
