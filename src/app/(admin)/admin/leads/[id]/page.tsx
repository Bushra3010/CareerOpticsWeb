import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { ArrowLeft, MessageCircle, Phone } from "lucide-react";

import { LeadNoteForm } from "@/components/admin/lead-note-form";
import { LeadStatusSelect } from "@/components/admin/lead-status-select";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { can, requireStaff } from "@/lib/auth";
import type { LeadStatus } from "@/config/leads";
import { getLead, getLeadActivities } from "@/lib/queries/admin";
import { createAdminClient } from "@/lib/supabase/admin";

export const metadata: Metadata = {
  title: "Lead",
  robots: { index: false, follow: false },
};

function formatWhen(value: string | null) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

/** `/admin/leads/[id]` — full record plus the notes timeline (§5.5). */
export default async function LeadDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const profile = await requireStaff();
  if (!can(profile.role, "leads")) redirect("/admin");

  const { id } = await params;
  const lead = await getLead(id);
  if (!lead) notFound();

  const activities = await getLeadActivities(id);
  const dial = `${lead.country_code ?? "+91"}${lead.phone}`;
  const answers = (lead.answers ?? null) as Record<string, string> | null;

  // The photo lives in a private bucket, so it needs a short-lived signed URL.
  // Minted per page view rather than stored, so nothing linkable leaks into the
  // page source or a shared screenshot beyond its lifetime.
  let photoUrl: string | null = null;
  if (answers?.photo_path) {
    const { data } = await createAdminClient()
      .storage.from("applicant-photos")
      .createSignedUrl(answers.photo_path, 300);
    photoUrl = data?.signedUrl ?? null;
  }

  const facts: { label: string; value: React.ReactNode }[] = [
    { label: "Received", value: formatWhen(lead.created_at) },
    { label: "Source", value: lead.source.replace(/_/g, " ") },
    { label: "Email", value: lead.email || "—" },
    { label: "City", value: lead.city || "—" },
    { label: "Level", value: lead.level || "—" },
    {
      label: "Course",
      value: lead.courses?.short_name ?? lead.courses?.name ?? "—",
    },
    {
      label: "College",
      value: lead.colleges?.slug ? (
        <Link
          href={`/colleges/${lead.colleges.slug}`}
          target="_blank"
          className="text-brand-blue-400 hover:underline"
        >
          {lead.colleges.name}
        </Link>
      ) : (
        "—"
      ),
    },
    { label: "Page", value: lead.page_url || "—" },
    {
      label: "Campaign",
      value:
        [lead.utm_source, lead.utm_medium, lead.utm_campaign]
          .filter(Boolean)
          .join(" / ") || "—",
    },
  ];

  return (
    <div>
      <Button asChild variant="ghost" size="sm" className="-ml-3">
        <Link href="/admin/leads">
          <ArrowLeft />
          Back to inbox
        </Link>
      </Button>

      <div className="mt-3 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-h2">{lead.name}</h1>
          <p className="mt-1 text-body tabular-nums">{dial}</p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button asChild>
            <a href={`tel:${dial}`}>
              <Phone />
              Call
            </a>
          </Button>
          <Button asChild variant="outline">
            <a
              href={`https://wa.me/${dial.replace(/\D/g, "")}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              <MessageCircle />
              WhatsApp
            </a>
          </Button>
          <LeadStatusSelect id={lead.id} status={(lead.status ?? "new") as LeadStatus} />
        </div>
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_380px]">
        <div className="grid gap-6">
          <section className="rounded-xl border bg-card p-5">
            <h2 className="text-h3">Details</h2>
            <dl className="mt-4 grid gap-3 sm:grid-cols-2">
              {facts.map((fact) => (
                <div key={fact.label}>
                  <dt className="text-sm text-muted-foreground">{fact.label}</dt>
                  <dd className="mt-0.5 break-words text-ink">{fact.value}</dd>
                </div>
              ))}
            </dl>

            {lead.message ? (
              <div className="mt-4 rounded-lg bg-surface p-3">
                <p className="text-sm text-muted-foreground">Message</p>
                <p className="mt-1 text-pretty text-ink">{lead.message}</p>
              </div>
            ) : null}
          </section>

          {answers && Object.keys(answers).length > 0 ? (
            <section className="rounded-xl border bg-card p-5">
              <h2 className="text-h3">Submitted details</h2>
              {photoUrl ? (
                <a
                  href={photoUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-4 inline-block overflow-hidden rounded-lg border focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element --
                      a signed URL that expires in 5 minutes; next/image would
                      cache it under a key that outlives the signature. */}
                  <img
                    src={photoUrl}
                    alt={`Photograph submitted by ${lead.name}`}
                    className="h-40 w-32 object-cover"
                  />
                </a>
              ) : answers.photo_path ? (
                <p className="mt-4 text-sm text-brand-red">
                  A photo was uploaded but the link could not be generated.
                </p>
              ) : null}

              <dl className="mt-4 grid gap-3 sm:grid-cols-2">
                {Object.entries(answers)
                  .filter(([key]) => key !== "photo_path")
                  .map(([key, value]) => (
                  <div key={key}>
                    <dt className="text-sm text-muted-foreground capitalize">
                      {key.replace(/_/g, " ")}
                    </dt>
                    <dd className="mt-0.5 text-ink">{String(value)}</dd>
                  </div>
                ))}
              </dl>
            </section>
          ) : null}
        </div>

        <aside className="grid gap-6">
          <section className="rounded-xl border bg-card p-5">
            <h2 className="text-h3">Notes</h2>
            <div className="mt-4">
              <LeadNoteForm leadId={lead.id} />
            </div>

            {activities.length > 0 ? (
              <ol className="mt-6 grid gap-4 border-t pt-4">
                {activities.map((activity) => (
                  <li key={activity.id} className="grid gap-1">
                    <div className="flex items-center gap-2">
                      <Badge
                        variant={activity.action === "note" ? "secondary" : "outline"}
                        size="sm"
                      >
                        {activity.action === "note" ? "Note" : "Status"}
                      </Badge>
                      <span className="text-sm text-muted-foreground tabular-nums">
                        {formatWhen(activity.created_at)}
                      </span>
                    </div>
                    <p className="text-pretty text-body">{activity.note}</p>
                  </li>
                ))}
              </ol>
            ) : (
              <p className="mt-6 border-t pt-4 text-sm text-muted-foreground">
                No activity yet.
              </p>
            )}
          </section>
        </aside>
      </div>
    </div>
  );
}
