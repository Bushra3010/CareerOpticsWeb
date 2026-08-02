import type { Metadata } from "next";
import Link from "next/link";

import { Download, MessageCircle, Phone, SearchX } from "lucide-react";

import { LeadStatusSelect } from "@/components/admin/lead-status-select";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { can, requireStaff } from "@/lib/auth";
import { LEAD_STATUSES, STATUS_LABELS, type LeadStatus } from "@/config/leads";
import { getLeadSources, listLeads } from "@/lib/queries/admin";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "Leads",
  robots: { index: false, follow: false },
};

function formatWhen(value: string | null) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

/** `/admin/leads` — §5.5 inbox. */
export default async function LeadsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; source?: string; q?: string; page?: string }>;
}) {
  const profile = await requireStaff();
  if (!can(profile.role, "leads")) redirect("/admin");

  const params = await searchParams;
  const [{ leads, total, page, pageCount }, sources] = await Promise.all([
    listLeads({
      status: params.status,
      source: params.source,
      q: params.q,
      page: params.page ? Number(params.page) : 1,
    }),
    getLeadSources(),
  ]);

  const exportHref = `/api/admin/leads/export?${new URLSearchParams(
    Object.entries(params).filter(([, v]) => v) as [string, string][],
  )}`;

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-h2">Leads</h1>
          <p className="mt-1 text-body">
            <span className="font-semibold text-ink tabular-nums">{total}</span>{" "}
            {total === 1 ? "lead" : "leads"} matching these filters.
          </p>
        </div>
        <Button asChild variant="outline">
          <a href={exportHref}>
            <Download />
            Export CSV
          </a>
        </Button>
      </div>

      {/* Plain GET form — filters belong in the URL so a counsellor can
          bookmark "my new leads" and the back button behaves. */}
      <form className="mt-6 flex flex-wrap items-end gap-3 rounded-xl border bg-card p-4">
        <div className="grid gap-1.5">
          <label htmlFor="q" className="text-sm font-medium text-ink">
            Search
          </label>
          <input
            id="q"
            name="q"
            defaultValue={params.q ?? ""}
            placeholder="Name or phone"
            className="h-10 w-[200px] rounded-lg border border-input bg-transparent px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
          />
        </div>

        <div className="grid gap-1.5">
          <label htmlFor="status" className="text-sm font-medium text-ink">
            Status
          </label>
          <select
            id="status"
            name="status"
            defaultValue={params.status ?? ""}
            className="h-10 w-[160px] rounded-lg border border-input bg-transparent px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
          >
            <option value="">All statuses</option>
            {LEAD_STATUSES.map((status) => (
              <option key={status} value={status}>
                {STATUS_LABELS[status]}
              </option>
            ))}
          </select>
        </div>

        <div className="grid gap-1.5">
          <label htmlFor="source" className="text-sm font-medium text-ink">
            Source
          </label>
          <select
            id="source"
            name="source"
            defaultValue={params.source ?? ""}
            className="h-10 w-[170px] rounded-lg border border-input bg-transparent px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
          >
            <option value="">All sources</option>
            {sources.map((source) => (
              <option key={source} value={source}>
                {source.replace(/_/g, " ")}
              </option>
            ))}
          </select>
        </div>

        <Button type="submit">Apply</Button>
        {params.status || params.source || params.q ? (
          <Button asChild variant="ghost">
            <Link href="/admin/leads">Clear</Link>
          </Button>
        ) : null}
      </form>

      {leads.length === 0 ? (
        <div className="mt-8 rounded-xl border border-dashed p-10 text-center">
          <SearchX className="mx-auto size-8 text-muted-foreground" aria-hidden />
          <h2 className="mt-3 text-h3">No leads match</h2>
          <p className="mt-1 text-body">
            {total === 0 && !params.status && !params.source && !params.q
              ? "Nothing has come in yet. Leads appear here the moment a student submits a form."
              : "Try clearing a filter."}
          </p>
        </div>
      ) : (
        <div className="mt-6 overflow-x-auto rounded-xl border bg-card">
          <table className="w-full min-w-[900px] border-collapse text-left text-sm">
            <caption className="sr-only">Lead inbox</caption>
            <thead className="bg-surface">
              <tr>
                {["Received", "Name", "Phone", "Interest", "Source", "Status", ""].map(
                  (heading) => (
                    <th
                      key={heading}
                      scope="col"
                      className="p-3 font-semibold text-ink"
                    >
                      {heading || <span className="sr-only">Actions</span>}
                    </th>
                  ),
                )}
              </tr>
            </thead>
            <tbody>
              {leads.map((lead) => {
                const dial = `${lead.country_code ?? "+91"}${lead.phone}`;
                const course = lead.courses?.short_name ?? lead.courses?.name;
                const interest = [course, lead.colleges?.name]
                  .filter(Boolean)
                  .join(" · ");

                return (
                  <tr key={lead.id} className="border-t align-top">
                    <td className="p-3 whitespace-nowrap text-muted-foreground tabular-nums">
                      {formatWhen(lead.created_at)}
                    </td>
                    <td className="p-3">
                      <Link
                        href={`/admin/leads/${lead.id}`}
                        className="font-semibold text-ink hover:text-brand-blue"
                      >
                        {lead.name}
                      </Link>
                      {lead.city ? (
                        <span className="block text-muted-foreground">{lead.city}</span>
                      ) : null}
                    </td>
                    <td className="p-3 whitespace-nowrap tabular-nums">{dial}</td>
                    <td className="max-w-[220px] p-3">
                      {interest || (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </td>
                    <td className="p-3">
                      <Badge variant="outline" size="sm">
                        {lead.source.replace(/_/g, " ")}
                      </Badge>
                    </td>
                    <td className="p-3">
                      <LeadStatusSelect
                        id={lead.id}
                        status={(lead.status ?? "new") as LeadStatus}
                      />
                    </td>
                    <td className="p-3">
                      <div className="flex gap-1">
                        <Button asChild variant="ghost" size="icon-sm" title="Call">
                          <a href={`tel:${dial}`}>
                            <Phone className="size-4" />
                            <span className="sr-only">Call {lead.name}</span>
                          </a>
                        </Button>
                        <Button asChild variant="ghost" size="icon-sm" title="WhatsApp">
                          <a
                            href={`https://wa.me/${dial.replace(/\D/g, "")}`}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <MessageCircle className="size-4" />
                            <span className="sr-only">WhatsApp {lead.name}</span>
                          </a>
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })}
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
                <Link href={pageLink(params, page - 1)}>Previous</Link>
              </Button>
            ) : null}
            {page < pageCount ? (
              <Button asChild variant="outline" size="sm">
                <Link href={pageLink(params, page + 1)}>Next</Link>
              </Button>
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}

function pageLink(
  params: { status?: string; source?: string; q?: string },
  page: number,
) {
  const search = new URLSearchParams();
  if (params.status) search.set("status", params.status);
  if (params.source) search.set("source", params.source);
  if (params.q) search.set("q", params.q);
  if (page > 1) search.set("page", String(page));
  const query = search.toString();
  return query ? `/admin/leads?${query}` : "/admin/leads";
}
