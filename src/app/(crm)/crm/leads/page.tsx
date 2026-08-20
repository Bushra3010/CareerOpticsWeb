import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { Download, MessageCircle, Phone, Plus, SearchX } from "lucide-react";

import { LeadAssignSelect } from "@/components/crm/lead-assign-select";
import { LeadFilters } from "@/components/crm/lead-filters";
import { LeadStatusSelect } from "@/components/crm/lead-status-select";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CRM_SOURCE_LABELS, type CrmLeadStatus } from "@/config/crm";
import { can, requireStaff } from "@/lib/auth";
import {
  getCrmLeadCounts,
  getCrmOptions,
  listCrmLeads,
  paymentState,
  type CrmLead,
} from "@/lib/queries/crm";
import { formatInr } from "@/lib/media";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "CRM leads",
  robots: { index: false, follow: false },
};

type Search = Record<string, string | undefined>;

function formatDate(value: string | null) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat("en-IN", { day: "2-digit", month: "short" }).format(date);
}

/** Overdue follow-ups are the whole point of the column, so they are marked. */
function followUpTone(value: string | null) {
  if (!value) return null;
  const today = new Date().toISOString().slice(0, 10);
  if (value < today) return "overdue";
  if (value === today) return "today";
  return "future";
}

export default async function CrmLeadsPage({
  searchParams,
}: {
  searchParams: Promise<Search>;
}) {
  const profile = await requireStaff();
  if (!can(profile.role, "leads")) redirect("/admin");

  const params = await searchParams;
  const [{ leads, total, page, pageCount }, options, counts] = await Promise.all([
    listCrmLeads({ ...params, page: params.page ? Number(params.page) : 1 }),
    getCrmOptions(),
    getCrmLeadCounts(),
  ]);

  const query = new URLSearchParams(
    Object.entries(params).filter(([, v]) => v) as [string, string][],
  );
  const staff = options.staff.map((s) => ({ id: s.id, name: s.name }));

  return (
    <div>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-h2">Leads</h1>
          <p className="mt-1 text-body">
            <span className="font-semibold text-ink tabular-nums">{total}</span>{" "}
            {total === 1 ? "lead" : "leads"} in this view ·{" "}
            <span className="tabular-nums">{counts.open}</span> open of{" "}
            <span className="tabular-nums">{counts.total}</span> total
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button asChild variant="outline">
            <a href={`/api/crm/leads/export?${query}`}>
              <Download />
              Export CSV
            </a>
          </Button>
          <Button asChild variant="outline">
            <Link href="/crm/leads/import">Import</Link>
          </Button>
          <Button asChild>
            <Link href="/crm/leads/new">
              <Plus />
              New lead
            </Link>
          </Button>
        </div>
      </div>

      <div className="mt-6">
        <LeadFilters options={options} values={params} />
      </div>

      {/* The default view hides converted and lost; this is how you see them. */}
      <div className="mt-4 flex gap-2">
        <ViewTab href={`/crm/leads${stripView(query)}`} active={params.view !== "all"}>
          Open
        </ViewTab>
        <ViewTab href={`/crm/leads?${withView(query, "all")}`} active={params.view === "all"}>
          All statuses
        </ViewTab>
      </div>

      {leads.length === 0 ? (
        <div className="mt-8 rounded-xl border border-dashed p-10 text-center">
          <SearchX className="mx-auto size-8 text-muted-foreground" aria-hidden />
          <h2 className="mt-3 text-h3">No leads match</h2>
          <p className="mt-1 text-body">
            {counts.total === 0
              ? "Nothing here yet. Website enquiries arrive automatically, or add one by hand."
              : "Try clearing a filter, or switch to All statuses."}
          </p>
        </div>
      ) : (
        <div className="mt-6 overflow-x-auto rounded-xl border bg-card">
          <table className="w-full min-w-[1100px] border-collapse text-left text-sm">
            <caption className="sr-only">CRM leads</caption>
            <thead className="bg-surface">
              <tr>
                {["Lead", "Phone", "Course", "Source", "Status", "Assigned", "Follow-up", "Fee", ""].map(
                  (heading) => (
                    <th key={heading} scope="col" className="p-3 font-semibold text-ink">
                      {heading || <span className="sr-only">Actions</span>}
                    </th>
                  ),
                )}
              </tr>
            </thead>
            <tbody>
              {leads.map((lead) => (
                <LeadRow key={lead.id} lead={lead} staff={staff} />
              ))}
            </tbody>
          </table>
        </div>
      )}

      {pageCount > 1 ? (
        <div className="mt-6 flex items-center justify-between">
          <p className="text-sm text-muted-foreground tabular-nums">
            Page {page} of {pageCount}
          </p>
          <div className="flex gap-2">
            {page > 1 ? (
              <Button asChild variant="outline" size="sm">
                <Link href={`/crm/leads?${pageQuery(query, page - 1)}`}>Previous</Link>
              </Button>
            ) : null}
            {page < pageCount ? (
              <Button asChild variant="outline" size="sm">
                <Link href={`/crm/leads?${pageQuery(query, page + 1)}`}>Next</Link>
              </Button>
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}

function LeadRow({
  lead,
  staff,
}: {
  lead: CrmLead;
  staff: { id: string; name: string }[];
}) {
  const tone = followUpTone(lead.next_followup_date);
  const paid = paymentState(lead);
  const dial = lead.phone.replace(/\D/g, "");

  return (
    <tr className="border-t align-top">
      <td className="p-3">
        <Link
          href={`/crm/leads/${lead.id}`}
          className="font-semibold text-ink hover:text-brand-blue"
        >
          {lead.full_name}
        </Link>
        <span className="block text-muted-foreground">
          {[lead.city, formatDate(lead.created_at)].filter(Boolean).join(" · ")}
        </span>
      </td>
      <td className="p-3 whitespace-nowrap tabular-nums">{lead.phone}</td>
      <td className="max-w-[170px] p-3">
        {lead.course?.name ?? <span className="text-muted-foreground">—</span>}
        {lead.sub_course?.name ? (
          <span className="block text-muted-foreground">{lead.sub_course.name}</span>
        ) : null}
      </td>
      <td className="p-3">
        <Badge variant="outline" size="sm">
          {CRM_SOURCE_LABELS[lead.source] ?? lead.source}
        </Badge>
        {/* A website lead keeps the page it came from, which is the useful bit. */}
        {typeof lead.metadata?.website_source === "string" ? (
          <span className="mt-1 block text-muted-foreground">
            {String(lead.metadata.website_source).replace(/_/g, " ")}
          </span>
        ) : null}
      </td>
      <td className="p-3">
        <LeadStatusSelect
          id={lead.id}
          status={lead.status as CrmLeadStatus}
          customStatus={lead.custom_status}
        />
      </td>
      <td className="p-3">
        <LeadAssignSelect id={lead.id} assignedTo={lead.assigned_to} staff={staff} />
      </td>
      <td className="p-3 whitespace-nowrap">
        {lead.next_followup_date ? (
          <Badge
            variant={tone === "overdue" ? "urgent" : tone === "today" ? "default" : "outline"}
            size="sm"
          >
            {formatDate(lead.next_followup_date)}
          </Badge>
        ) : (
          <span className="text-muted-foreground">—</span>
        )}
      </td>
      <td className="p-3 whitespace-nowrap tabular-nums">
        {lead.total_fee ? (
          <>
            <span className="font-medium text-ink">{formatInr(lead.amount_paid) ?? "₹0"}</span>
            <span className="text-muted-foreground"> / {formatInr(lead.total_fee)}</span>
            <Badge
              variant={paid === "paid" ? "success" : paid === "partial" ? "urgent" : "outline"}
              size="sm"
              className="mt-1 block w-fit"
            >
              {paid}
            </Badge>
          </>
        ) : (
          <span className="text-muted-foreground">—</span>
        )}
      </td>
      <td className="p-3">
        <div className="flex gap-1">
          <Button asChild variant="ghost" size="icon-sm" title="Call">
            <a href={`tel:${lead.phone}`}>
              <Phone className="size-4" />
              <span className="sr-only">Call {lead.full_name}</span>
            </a>
          </Button>
          <Button asChild variant="ghost" size="icon-sm" title="WhatsApp">
            <a
              href={`https://wa.me/${dial.length === 10 ? `91${dial}` : dial}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              <MessageCircle className="size-4" />
              <span className="sr-only">WhatsApp {lead.full_name}</span>
            </a>
          </Button>
        </div>
      </td>
    </tr>
  );
}

function ViewTab({
  href,
  active,
  children,
}: {
  href: string;
  active: boolean;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={
        active
          ? "rounded-lg bg-brand-blue-50 px-3 py-1.5 text-sm font-semibold text-brand-blue"
          : "rounded-lg px-3 py-1.5 text-sm font-medium text-body hover:bg-surface"
      }
    >
      {children}
    </Link>
  );
}

function stripView(query: URLSearchParams) {
  const next = new URLSearchParams(query);
  next.delete("view");
  next.delete("page");
  const s = next.toString();
  return s ? `?${s}` : "";
}

function withView(query: URLSearchParams, view: string) {
  const next = new URLSearchParams(query);
  next.set("view", view);
  next.delete("page");
  return next.toString();
}

function pageQuery(query: URLSearchParams, page: number) {
  const next = new URLSearchParams(query);
  if (page > 1) next.set("page", String(page));
  else next.delete("page");
  return next.toString();
}
