"use client";

import { useRouter } from "next/navigation";
import * as React from "react";

import { Loader2 } from "lucide-react";

import { createAppointment } from "@/app/(crm)/crm/phase2-actions";
import { Disclosure } from "@/components/crm/action-controls";
import { Button } from "@/components/ui/button";
import { APPOINTMENT_SLOTS, APPOINTMENT_TYPES } from "@/config/crm";

const CONTROL =
  "h-10 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:opacity-60";

type LeadHit = { id: string; full_name: string; phone: string };

/**
 * Book an appointment against a lead.
 *
 * Its own component rather than an `ActionForm` for two reasons: the lead is
 * chosen by searching rather than from a fixed list (the pipeline is far too
 * long for a `<select>`), and the Meet link is only required for one of the
 * two appointment types.
 */
export function AppointmentForm({
  staff,
  defaultDate,
}: {
  staff: { id: string; name: string }[];
  defaultDate: string;
}) {
  const router = useRouter();
  const formRef = React.useRef<HTMLFormElement>(null);
  const [pending, startTransition] = React.useTransition();
  const [error, setError] = React.useState<string | null>(null);

  const [query, setQuery] = React.useState("");
  const [hits, setHits] = React.useState<LeadHit[]>([]);
  const [lead, setLead] = React.useState<LeadHit | null>(null);
  const [searching, setSearching] = React.useState(false);
  const [type, setType] = React.useState<string>("office_visit");

  // Debounced so typing a name is not one request per keystroke.
  React.useEffect(() => {
    if (lead || query.trim().length < 2) {
      setHits([]);
      return;
    }
    const timer = window.setTimeout(async () => {
      setSearching(true);
      try {
        const res = await fetch(`/api/crm/lead-search?q=${encodeURIComponent(query.trim())}`);
        setHits(res.ok ? await res.json() : []);
      } catch {
        setHits([]);
      } finally {
        setSearching(false);
      }
    }, 300);
    return () => window.clearTimeout(timer);
  }, [query, lead]);

  const onSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!lead) {
      setError("Pick a lead first.");
      return;
    }
    const form = new FormData(event.currentTarget);
    form.set("lead_id", lead.id);
    setError(null);

    startTransition(async () => {
      const result = await createAppointment(form);
      if (!result.ok) {
        setError(result.error ?? "Could not book it.");
        return;
      }
      formRef.current?.reset();
      setLead(null);
      setQuery("");
      setType("office_visit");
      router.refresh();
    });
  };

  return (
    <Disclosure label="Book an appointment">
      <form ref={formRef} onSubmit={onSubmit} className="grid gap-3">
        <div className="grid gap-1.5">
          <label htmlFor="ap-lead" className="text-sm font-medium text-ink">
            Lead<span className="text-destructive" aria-hidden> *</span>
          </label>

          {lead ? (
            <div className="flex items-center justify-between gap-3 rounded-lg border bg-surface px-3 py-2">
              <span className="text-sm">
                <span className="font-semibold text-ink">{lead.full_name}</span>
                <span className="ml-2 text-muted-foreground tabular-nums">{lead.phone}</span>
              </span>
              <Button type="button" variant="ghost" size="sm" onClick={() => setLead(null)}>
                Change
              </Button>
            </div>
          ) : (
            <>
              <input
                id="ap-lead"
                value={query}
                disabled={pending}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search by name or phone"
                className={CONTROL}
                autoComplete="off"
              />
              {searching ? (
                <p className="text-sm text-muted-foreground">Searching…</p>
              ) : hits.length > 0 ? (
                <ul className="grid gap-1 rounded-lg border p-1">
                  {hits.map((hit) => (
                    <li key={hit.id}>
                      <button
                        type="button"
                        onClick={() => { setLead(hit); setHits([]); }}
                        className="w-full rounded px-2 py-1.5 text-left text-sm hover:bg-surface focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
                      >
                        <span className="font-medium text-ink">{hit.full_name}</span>
                        <span className="ml-2 text-muted-foreground tabular-nums">{hit.phone}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              ) : query.trim().length >= 2 ? (
                <p className="text-sm text-muted-foreground">No lead matches.</p>
              ) : null}
            </>
          )}
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <div className="grid gap-1.5">
            <label htmlFor="ap-host" className="text-sm font-medium text-ink">
              Host<span className="text-destructive" aria-hidden> *</span>
            </label>
            <select id="ap-host" name="host_id" required disabled={pending} className={CONTROL}>
              {staff.map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>

          <div className="grid gap-1.5">
            <label htmlFor="ap-type" className="text-sm font-medium text-ink">
              Type<span className="text-destructive" aria-hidden> *</span>
            </label>
            <select
              id="ap-type"
              name="appointment_type"
              required
              disabled={pending}
              value={type}
              onChange={(e) => setType(e.target.value)}
              className={CONTROL}
            >
              {APPOINTMENT_TYPES.map((t) => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
          </div>

          <div className="grid gap-1.5">
            <label htmlFor="ap-date" className="text-sm font-medium text-ink">
              Date<span className="text-destructive" aria-hidden> *</span>
            </label>
            <input
              id="ap-date"
              name="scheduled_date"
              type="date"
              required
              disabled={pending}
              defaultValue={defaultDate}
              className={CONTROL}
            />
          </div>

          <div className="grid gap-1.5">
            <label htmlFor="ap-time" className="text-sm font-medium text-ink">
              Slot<span className="text-destructive" aria-hidden> *</span>
            </label>
            <select id="ap-time" name="scheduled_time" required disabled={pending} className={CONTROL}>
              {APPOINTMENT_SLOTS.map((slot) => (
                <option key={slot} value={slot}>{slot}</option>
              ))}
            </select>
          </div>

          {type === "google_meet" ? (
            <div className="grid gap-1.5 sm:col-span-2">
              <label htmlFor="ap-link" className="text-sm font-medium text-ink">
                Meet link<span className="text-destructive" aria-hidden> *</span>
              </label>
              <input
                id="ap-link"
                name="meet_link"
                type="url"
                required
                disabled={pending}
                placeholder="https://meet.google.com/…"
                className={CONTROL}
              />
            </div>
          ) : null}

          <div className="grid gap-1.5 sm:col-span-2">
            <label htmlFor="ap-notes" className="text-sm font-medium text-ink">Notes</label>
            <textarea
              id="ap-notes"
              name="notes"
              rows={2}
              disabled={pending}
              placeholder="Purpose of the visit"
              className="w-full resize-y rounded-lg border border-input bg-transparent px-2.5 py-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:opacity-60"
            />
          </div>
        </div>

        {error ? (
          <p role="alert" className="text-sm font-medium text-destructive">{error}</p>
        ) : null}

        <div>
          <Button type="submit" disabled={pending}>
            {pending ? <Loader2 className="animate-spin" aria-hidden /> : null}
            {pending ? "Booking…" : "Book appointment"}
          </Button>
        </div>
      </form>
    </Disclosure>
  );
}
