import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { Receipt } from "lucide-react";

import { ActionButton, Disclosure } from "@/components/crm/action-controls";
import { ActionForm } from "@/components/crm/action-form";
import { CRM_CONTROL, CrmEmpty, CrmPageHeader, CrmStat, CrmTable } from "@/components/crm/crm-ui";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  APPROVAL_STATUSES,
  APPROVAL_STATUS_LABELS,
  EXPENSE_CATEGORIES,
  EXPENSE_CATEGORY_LABELS,
  PAYMENT_MODES,
  type ApprovalStatus,
} from "@/config/crm";
import { decideExpense, submitExpense } from "@/app/(crm)/crm/phase2-actions";
import { can, isCrmManager, requireStaff } from "@/lib/auth";
import { formatInr } from "@/lib/media";
import { getCrmMoneyStats, listExpenses } from "@/lib/queries/crm";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Finance",
  robots: { index: false, follow: false },
};

const TONE: Record<ApprovalStatus, "secondary" | "success" | "urgent"> = {
  pending: "secondary",
  approved: "success",
  rejected: "urgent",
};

export default async function FinancePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const profile = await requireStaff();
  if (!can(profile.role, "leads")) redirect("/admin");

  const manager = isCrmManager(profile.role);
  const params = await searchParams;

  const [expenses, money] = await Promise.all([
    listExpenses({ status: params.status, category: params.category }),
    getCrmMoneyStats(),
  ]);

  const approved = expenses
    .filter((e) => e.status === "approved")
    .reduce((sum, e) => sum + Number(e.amount ?? 0), 0);
  const pending = expenses.filter((e) => e.status === "pending").length;

  return (
    <div>
      <CrmPageHeader
        title="Finance"
        description="Fees collected against costs incurred."
      />

      <dl className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <CrmStat label="Collected (30 days)" value={formatInr(money.collected30) ?? "₹0"} tone="success" />
        <CrmStat label="Outstanding fees" value={formatInr(money.outstanding) ?? "₹0"} />
        <CrmStat label="Approved expenses" value={formatInr(approved) ?? "₹0"} />
        <CrmStat label="Awaiting approval" value={String(pending)} tone={pending > 0 ? "urgent" : undefined} />
      </dl>

      <form className="mt-6 flex flex-wrap items-end gap-3 rounded-xl border bg-card p-4">
        <div className="grid gap-1.5">
          <label htmlFor="fx-status" className="text-sm font-medium text-ink">Status</label>
          <select id="fx-status" name="status" defaultValue={params.status ?? ""} className={`${CRM_CONTROL} w-[170px]`}>
            <option value="">All</option>
            {APPROVAL_STATUSES.map((s) => (
              <option key={s} value={s}>{APPROVAL_STATUS_LABELS[s]}</option>
            ))}
          </select>
        </div>
        <div className="grid gap-1.5">
          <label htmlFor="fx-cat" className="text-sm font-medium text-ink">Category</label>
          <select id="fx-cat" name="category" defaultValue={params.category ?? ""} className={`${CRM_CONTROL} w-[180px]`}>
            <option value="">All</option>
            {EXPENSE_CATEGORIES.map((c) => (
              <option key={c} value={c}>{EXPENSE_CATEGORY_LABELS[c]}</option>
            ))}
          </select>
        </div>
        <Button type="submit">Apply</Button>
      </form>

      <div className="mt-6">
        <Disclosure label="Submit an expense">
          <ActionForm
            action={submitExpense}
            submitLabel="Submit"
            fields={[
              {
                name: "category", label: "Category", type: "select", required: true,
                options: EXPENSE_CATEGORIES.map((c) => ({ value: c, label: EXPENSE_CATEGORY_LABELS[c] })),
              },
              { name: "amount", label: "Amount (₹)", type: "number", step: "any", min: "1", required: true },
              { name: "expense_date", label: "Date", type: "date", required: true,
                defaultValue: new Date().toISOString().slice(0, 10) },
              {
                name: "payment_mode", label: "Paid by", type: "select",
                options: PAYMENT_MODES.map((m) => ({ value: m, label: m.toUpperCase() })),
              },
              { name: "description", label: "Description", required: true, wide: true },
              { name: "bill_url", label: "Bill URL", type: "url", wide: true },
              { name: "notes", label: "Notes", type: "textarea" },
            ]}
          />
        </Disclosure>
      </div>

      {expenses.length === 0 ? (
        <CrmEmpty title="No expenses" icon={<Receipt className="size-8" aria-hidden />}>
          Submit one above. A manager approves it before it counts.
        </CrmEmpty>
      ) : (
        <CrmTable
          caption="Expenses"
          headers={["Date", "Description", "Category", "Amount", "Status"]}
          minWidth={880}
        >
          {expenses.map((e) => (
            <tr key={e.id} className="border-t align-top">
              <td className="p-3 text-sm text-muted-foreground tabular-nums">{e.expense_date}</td>
              <td className="p-3">
                <span className="font-medium text-ink">{e.description}</span>
                {e.notes ? (
                  <span className="block text-sm text-muted-foreground">{e.notes}</span>
                ) : null}
                {e.bill_url ? (
                  <a href={e.bill_url} target="_blank" rel="noreferrer"
                    className="text-sm text-brand-blue-400 hover:underline">
                    Bill
                  </a>
                ) : null}
              </td>
              <td className="p-3 text-sm">
                {EXPENSE_CATEGORY_LABELS[e.category as keyof typeof EXPENSE_CATEGORY_LABELS] ?? e.category}
                {e.payment_mode ? (
                  <span className="block text-muted-foreground">{String(e.payment_mode).toUpperCase()}</span>
                ) : null}
              </td>
              <td className="p-3 font-semibold text-ink tabular-nums">
                {formatInr(Number(e.amount ?? 0))}
              </td>
              <td className="p-3">
                <Badge variant={TONE[e.status as ApprovalStatus]} size="sm">
                  {APPROVAL_STATUS_LABELS[e.status as ApprovalStatus]}
                </Badge>
                {manager && e.status === "pending" ? (
                  <div className="mt-2 flex gap-2">
                    <ActionButton action={decideExpense} payload={{ id: e.id as string, status: "approved" }}>
                      Approve
                    </ActionButton>
                    <ActionButton
                      action={decideExpense}
                      payload={{ id: e.id as string, status: "rejected" }}
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
