"use client";

import { useRouter } from "next/navigation";
import * as React from "react";

import { Loader2 } from "lucide-react";

import { createLead, saveLeadDetails } from "@/app/(admin)/admin/crm/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CRM_LEAD_SOURCES, CRM_MODES, CRM_SOURCE_LABELS } from "@/config/crm";
import type { CrmLead, CrmOptions } from "@/lib/queries/crm";

const CONTROL =
  "h-10 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50";

/** Create and edit share one form — the field set is identical. */
export function LeadForm({
  lead,
  options,
}: {
  lead?: CrmLead | null;
  options: CrmOptions;
}) {
  const router = useRouter();
  const [pending, startTransition] = React.useTransition();
  const [error, setError] = React.useState<string | null>(null);

  // Sub-courses and sub-sections only make sense under their parent, so both
  // narrow as soon as the parent is chosen.
  const [courseId, setCourseId] = React.useState(lead?.course?.id ?? "");
  const [departmentId, setDepartmentId] = React.useState(lead?.department?.id ?? "");

  const subCourses = options.subCourses.filter((s) => !courseId || s.course_id === courseId);
  const subSections = options.subSections.filter(
    (s) => !departmentId || s.department_id === departmentId,
  );

  const onSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    if (lead) form.set("id", lead.id);
    setError(null);

    startTransition(async () => {
      const result = lead ? await saveLeadDetails(form) : await createLead(form);
      if (!result.ok) {
        setError(result.error ?? "Could not save.");
        return;
      }
      const id = lead?.id ?? ("id" in result ? result.id : undefined);
      router.push(id ? `/admin/crm/leads/${id}` : "/admin/crm/leads");
      router.refresh();
    });
  };

  return (
    <form onSubmit={onSubmit} className="grid max-w-3xl gap-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Full name" required>
          {(id) => <Input id={id} name="full_name" required defaultValue={lead?.full_name ?? ""} className="h-10" />}
        </Field>
        <Field label="Phone" required>
          {(id) => (
            <Input id={id} name="phone" required inputMode="tel" defaultValue={lead?.phone ?? ""} className="h-10" />
          )}
        </Field>
        <Field label="Email">
          {(id) => <Input id={id} name="email" type="email" defaultValue={lead?.email ?? ""} className="h-10" />}
        </Field>
        <Field label="City">
          {(id) => <Input id={id} name="city" defaultValue={lead?.city ?? ""} className="h-10" />}
        </Field>
        <Field label="State">
          {(id) => <Input id={id} name="state" defaultValue={lead?.state ?? ""} className="h-10" />}
        </Field>
        <Field label="Source">
          {(id) => (
            <select id={id} name="source" defaultValue={lead?.source ?? "walk_in"} className={CONTROL}>
              {CRM_LEAD_SOURCES.map((source) => (
                <option key={source} value={source}>
                  {CRM_SOURCE_LABELS[source]}
                </option>
              ))}
            </select>
          )}
        </Field>
      </div>

      <div className="grid gap-4 border-t pt-5 sm:grid-cols-2">
        <Field label="Course">
          {(id) => (
            <select
              id={id}
              name="course_id"
              value={courseId}
              onChange={(e) => setCourseId(e.target.value)}
              className={CONTROL}
            >
              <option value="">— none —</option>
              {options.courses.map((course) => (
                <option key={course.id} value={course.id}>{course.name}</option>
              ))}
            </select>
          )}
        </Field>
        <Field label="Specialisation">
          {(id) => (
            <select id={id} name="sub_course_id" defaultValue={lead?.sub_course?.id ?? ""} className={CONTROL}>
              <option value="">— none —</option>
              {subCourses.map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          )}
        </Field>
        <Field label="Department">
          {(id) => (
            <select
              id={id}
              name="department_id"
              value={departmentId}
              onChange={(e) => setDepartmentId(e.target.value)}
              className={CONTROL}
            >
              <option value="">— none —</option>
              {options.departments.map((d) => (
                <option key={d.id} value={d.id}>{d.name}</option>
              ))}
            </select>
          )}
        </Field>
        <Field label="University / Board">
          {(id) => (
            <select id={id} name="sub_section_id" defaultValue="" className={CONTROL}>
              <option value="">— none —</option>
              {subSections.map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          )}
        </Field>
        <Field label="Session">
          {(id) => (
            <select id={id} name="session_id" defaultValue={lead?.session?.id ?? ""} className={CONTROL}>
              <option value="">— none —</option>
              {options.sessions.map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          )}
        </Field>
        <Field label="Mode">
          {(id) => (
            <select id={id} name="mode" defaultValue={lead?.mode ?? ""} className={CONTROL}>
              <option value="">— none —</option>
              {CRM_MODES.map((m) => (
                <option key={m.value} value={m.value}>{m.label}</option>
              ))}
            </select>
          )}
        </Field>
      </div>

      <div className="grid gap-4 border-t pt-5 sm:grid-cols-3">
        <Field label="Total fee (₹)">
          {(id) => (
            <Input id={id} name="total_fee" type="number" step="any" min="0"
              defaultValue={lead?.total_fee ?? ""} className="h-10" />
          )}
        </Field>
        <Field label="Amount paid (₹)">
          {(id) => (
            <Input id={id} name="amount_paid" type="number" step="any" min="0"
              defaultValue={lead?.amount_paid ?? ""} className="h-10" />
          )}
        </Field>
        <Field label="Expected enrollment">
          {(id) => (
            <Input id={id} name="enrollment_date" type="date"
              defaultValue={lead?.enrollment_date ?? ""} className="h-10" />
          )}
        </Field>
      </div>

      {error ? (
        <p role="alert" className="rounded-lg bg-destructive/10 p-3 text-sm font-medium text-destructive">
          {error}
        </p>
      ) : null}

      <div className="flex gap-3 border-t pt-5">
        <Button type="submit" size="lg" disabled={pending}>
          {pending ? <Loader2 className="animate-spin" /> : null}
          {lead ? "Save changes" : "Create lead"}
        </Button>
        <Button type="button" size="lg" variant="ghost" disabled={pending} onClick={() => router.back()}>
          Cancel
        </Button>
      </div>
    </form>
  );
}

function Field({
  label,
  required = false,
  children,
}: {
  label: string;
  required?: boolean;
  children: (id: string) => React.ReactNode;
}) {
  const id = React.useId();
  return (
    <div className="grid gap-1.5">
      <Label htmlFor={id}>
        {label}
        {required ? <span className="text-destructive" aria-hidden>*</span> : null}
      </Label>
      {children(id)}
    </div>
  );
}
