import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { ArrowLeft, ExternalLink, MessageCircle, Phone } from "lucide-react";

import { LeadActionsPanel } from "@/components/crm/lead-actions-panel";
import { LeadAssignSelect } from "@/components/crm/lead-assign-select";
import { LeadStatusSelect } from "@/components/crm/lead-status-select";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  CRM_ACTIVITY_LABELS,
  CRM_SOURCE_LABELS,
  type CrmActivityType,
  type CrmLeadStatus,
} from "@/config/crm";
import { can, requireStaff } from "@/lib/auth";
import {
  getCrmLead,
  getCrmLeadActivities,
  getCrmOptions,
} from "@/lib/queries/crm";
import { formatInr } from "@/lib/media";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Lead",
  robots: { index: false, follow: false },
};

function when(value: string | null) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function day(value: string | null) {
  if (!value) return "—";
  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat("en-IN", { dateStyle: "medium" }).format(date);
}

export default async function CrmLeadPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const profile = await requireStaff();
  if (!can(profile.role, "leads")) redirect("/admin");

  const { id } = await params;
  const lead = await getCrmLead(id);
  if (!lead) notFound();

  const [activities, options] = await Promise.all([
    getCrmLeadActivities(id),
    getCrmOptions(),
  ]);

  const dial = lead.phone.replace(/\D/g, "");
  const staff = options.staff.map((s) => ({ id: s.id, name: s.name }));
  const meta = (lead.metadata ?? {}) as Record<string, unknown>;
  const answers = (meta.answers ?? null) as Record<string, string> | null;

  const facts: { label: string; value: React.ReactNode }[] = [
    { label: "Received", value: when(lead.created_at) },
    { label: "Source", value: CRM_SOURCE_LABELS[lead.source] ?? lead.source },
    { label: "Email", value: lead.email || "—" },
    { label: "City", value: [lead.city, lead.state].filter(Boolean).join(", ") || "—" },
    { label: "Course", value: lead.course?.name ?? "—" },
    { label: "Specialisation", value: lead.sub_course?.name ?? "—" },
    { label: "Session", value: lead.session?.name ?? "—" },
    { label: "Department", value: lead.department?.name ?? "—" },
    { label: "Mode", value: lead.mode ?? "—" },
    { label: "Expected enrollment", value: day(lead.enrollment_date) },
    {
      label: "Fee",
      value: lead.total_fee
        ? `${formatInr(lead.amount_paid) ?? "₹0"} of ${formatInr(lead.total_fee)}`
        : "—",
    },
  ];

  return (
    <div>
      <Button asChild variant="ghost" size="sm" className="-ml-3">
        <Link href="/crm/leads">
          <ArrowLeft />
          Back to leads
        </Link>
      </Button>

      <div className="mt-3 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-h2">{lead.full_name}</h1>
          <p className="mt-1 text-body tabular-nums">{lead.phone}</p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button asChild>
            <a href={`tel:${lead.phone}`}>
              <Phone />
              Call
            </a>
          </Button>
          <Button asChild variant="outline">
            <a
              href={`https://wa.me/${dial.length === 10 ? `91${dial}` : dial}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              <MessageCircle />
              WhatsApp
            </a>
          </Button>
          <LeadStatusSelect
            id={lead.id}
            status={lead.status as CrmLeadStatus}
            customStatus={lead.custom_status}
          />
          <LeadAssignSelect id={lead.id} assignedTo={lead.assigned_to} staff={staff} />
        </div>
      </div>

      {lead.status === "converted" ? (
        <p className="mt-4 rounded-lg border border-success/30 bg-success/5 p-3 text-sm text-ink">
          Converted on {when(lead.converted_at)}. A student record was created and
          is waiting for approval under{" "}
          <Link href="/crm/students?status=pending" className="font-semibold text-brand-blue-400 hover:underline">
            Students
          </Link>
          .
        </p>
      ) : null}

      <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_400px]">
        <div className="grid gap-6">
          <section className="rounded-xl border bg-card p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-h3">Details</h2>
              <Button asChild variant="outline" size="sm">
                <Link href={`/crm/leads/${lead.id}/edit`}>Edit</Link>
              </Button>
            </div>

            <dl className="mt-4 grid gap-3 sm:grid-cols-2">
              {facts.map((fact) => (
                <div key={fact.label}>
                  <dt className="text-sm text-muted-foreground">{fact.label}</dt>
                  <dd className="mt-0.5 break-words text-ink">{fact.value}</dd>
                </div>
              ))}
            </dl>
          </section>

          {/* Everything the website knew, kept verbatim so a counsellor does
              not have to go looking in the public leads table. */}
          {Object.keys(meta).length > 0 ? (
            <section className="rounded-xl border bg-card p-5">
              <h2 className="text-h3">From the website</h2>
              <dl className="mt-4 grid gap-3 sm:grid-cols-2">
                {(["website_source", "page_url", "level", "utm_source", "utm_medium", "utm_campaign"] as const)
                  .filter((key) => meta[key])
                  .map((key) => (
                    <div key={key}>
                      <dt className="text-sm text-muted-foreground capitalize">
                        {key.replace(/_/g, " ")}
                      </dt>
                      <dd className="mt-0.5 break-all text-ink">{String(meta[key])}</dd>
                    </div>
                  ))}
              </dl>

              {typeof meta.message === "string" && meta.message ? (
                <div className="mt-4 rounded-lg bg-surface p-3">
                  <p className="text-sm text-muted-foreground">What they wrote</p>
                  <p className="mt-1 text-pretty text-ink">{meta.message}</p>
                </div>
              ) : null}

              {answers && Object.keys(answers).length > 0 ? (
                <div className="mt-4">
                  <p className="text-sm text-muted-foreground">College Finder answers</p>
                  <dl className="mt-2 grid gap-2 sm:grid-cols-3">
                    {Object.entries(answers).map(([key, value]) => (
                      <div key={key} className="rounded-lg bg-surface p-2">
                        <dt className="text-sm text-muted-foreground capitalize">
                          {key.replace(/_/g, " ")}
                        </dt>
                        <dd className="text-ink">{String(value)}</dd>
                      </div>
                    ))}
                  </dl>
                </div>
              ) : null}

              {lead.website_lead_id ? (
                <p className="mt-4 text-sm text-muted-foreground">
                  Website enquiry{" "}
                  <Link
                    href={`/admin/leads/${lead.website_lead_id}`}
                    className="inline-flex items-center gap-1 font-medium text-brand-blue-400 hover:underline"
                  >
                    original record
                    <ExternalLink className="size-3.5" aria-hidden />
                  </Link>
                </p>
              ) : null}
            </section>
          ) : null}
        </div>

        <aside className="grid gap-6">
          <section className="rounded-xl border bg-card p-5">
            <h2 className="text-h3">Work this lead</h2>
            <div className="mt-4">
              <LeadActionsPanel leadId={lead.id} followUp={lead.next_followup_date} />
            </div>
          </section>

          <section className="rounded-xl border bg-card p-5">
            <h2 className="text-h3">Timeline</h2>
            {activities.length === 0 ? (
              <p className="mt-3 text-sm text-muted-foreground">
                Nothing logged yet.
              </p>
            ) : (
              <ol className="mt-4 grid gap-4">
                {activities.map((activity) => (
                  <li key={activity.id} className="grid gap-1 border-l-2 border-border pl-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant="secondary" size="sm">
                        {CRM_ACTIVITY_LABELS[activity.activity_type as CrmActivityType] ??
                          activity.activity_type}
                      </Badge>
                      <span className="text-sm text-muted-foreground tabular-nums">
                        {when(activity.created_at)}
                      </span>
                    </div>
                    {activity.note ? (
                      <p className="text-pretty text-body">{activity.note}</p>
                    ) : null}
                    {!activity.note && activity.new_value ? (
                      <p className="text-body">
                        {activity.old_value ? `${activity.old_value} → ` : ""}
                        {activity.new_value}
                      </p>
                    ) : null}
                  </li>
                ))}
              </ol>
            )}
          </section>
        </aside>
      </div>
    </div>
  );
}
