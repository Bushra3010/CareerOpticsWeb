"use client";

import Link from "next/link";

import { Search, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  CRM_LEAD_SOURCES,
  CRM_LEAD_STATUSES,
  CRM_SOURCE_LABELS,
  CRM_STATUS_LABELS,
  PAYMENT_FILTERS,
} from "@/config/crm";
import type { CrmOptions } from "@/lib/queries/crm";

const CONTROL =
  "h-10 rounded-lg border border-input bg-transparent px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50";

/**
 * Lead filter bar.
 *
 * A plain GET form, so every filtered view is a shareable URL and the back
 * button behaves — the same reasoning as the public `/colleges` listing. No
 * client state, no fetch on change.
 */
export function LeadFilters({
  options,
  values,
}: {
  options: CrmOptions;
  values: Record<string, string | undefined>;
}) {
  const active = Object.entries(values).some(
    ([key, value]) => value && key !== "view" && key !== "page",
  );

  return (
    <form className="grid gap-3 rounded-xl border bg-card p-4">
      <div className="flex flex-wrap items-end gap-3">
        <div className="grid gap-1.5">
          <label htmlFor="crm-q" className="text-sm font-medium text-ink">
            Search
          </label>
          <div className="relative">
            <Search
              className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground"
              aria-hidden
            />
            <input
              id="crm-q"
              name="q"
              defaultValue={values.q ?? ""}
              placeholder="Name, phone or email"
              className={`${CONTROL} w-[230px] pl-8`}
            />
          </div>
        </div>

        <Field id="crm-status" label="Status">
          <select id="crm-status" name="status" defaultValue={values.status ?? ""} className={`${CONTROL} w-[170px]`}>
            <option value="">Open leads</option>
            {CRM_LEAD_STATUSES.map((status) => (
              <option key={status} value={status}>
                {CRM_STATUS_LABELS[status]}
              </option>
            ))}
          </select>
        </Field>

        <Field id="crm-assigned" label="Assigned to">
          <select id="crm-assigned" name="assigned" defaultValue={values.assigned ?? ""} className={`${CONTROL} w-[170px]`}>
            <option value="">Anyone</option>
            <option value="unassigned">Unassigned</option>
            {options.staff.map((person) => (
              <option key={person.id} value={person.id}>
                {person.name}
              </option>
            ))}
          </select>
        </Field>

        <Field id="crm-source" label="Source">
          <select id="crm-source" name="source" defaultValue={values.source ?? ""} className={`${CONTROL} w-[150px]`}>
            <option value="">All sources</option>
            {CRM_LEAD_SOURCES.map((source) => (
              <option key={source} value={source}>
                {CRM_SOURCE_LABELS[source]}
              </option>
            ))}
          </select>
        </Field>

        <Field id="crm-course" label="Course">
          <select id="crm-course" name="course" defaultValue={values.course ?? ""} className={`${CONTROL} w-[160px]`}>
            <option value="">All courses</option>
            {options.courses.map((course) => (
              <option key={course.id} value={course.id}>
                {course.name}
              </option>
            ))}
          </select>
        </Field>

        <Field id="crm-payment" label="Payment">
          <select id="crm-payment" name="payment" defaultValue={values.payment ?? ""} className={`${CONTROL} w-[140px]`}>
            <option value="">Any</option>
            {PAYMENT_FILTERS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </Field>

        <Field id="crm-from" label="From">
          <input id="crm-from" name="from" type="date" defaultValue={values.from ?? ""} className={`${CONTROL} w-[150px]`} />
        </Field>

        <Field id="crm-to" label="To">
          <input id="crm-to" name="to" type="date" defaultValue={values.to ?? ""} className={`${CONTROL} w-[150px]`} />
        </Field>

        {/* Carried so applying a filter does not silently drop the All view. */}
        {values.view ? <input type="hidden" name="view" value={values.view} /> : null}

        <Button type="submit">Apply</Button>
        {active ? (
          <Button asChild variant="ghost">
            <Link href="/crm/leads">
              <X className="size-3.5" />
              Clear
            </Link>
          </Button>
        ) : null}
      </div>
    </form>
  );
}

function Field({
  id,
  label,
  children,
}: {
  id: string;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="grid gap-1.5">
      <label htmlFor={id} className="text-sm font-medium text-ink">
        {label}
      </label>
      {children}
    </div>
  );
}
