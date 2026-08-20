import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { ActionButton, Disclosure } from "@/components/crm/action-controls";
import { ActionForm } from "@/components/crm/action-form";
import { CrmPageHeader, CrmSection } from "@/components/crm/crm-ui";
import { Badge } from "@/components/ui/badge";
import {
  saveFormField,
  saveReferenceRow,
  toggleReferenceRow,
} from "@/app/(crm)/crm/phase2-actions";
import { isCrmManager, requireStaff } from "@/lib/auth";
import { getSettingsData } from "@/lib/queries/crm";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "CRM settings",
  robots: { index: false, follow: false },
};

type Row = { id: string; name: string; is_active: boolean };

export default async function CrmSettingsPage() {
  const profile = await requireStaff();
  if (!isCrmManager(profile.role)) redirect("/crm");

  const data = await getSettingsData();

  return (
    <div>
      <CrmPageHeader
        title="CRM settings"
        description="The lists every CRM form picks from, and which fields the lead form shows."
      />

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <ReferenceList
          title="Departments"
          description="The top-level grouping a lead or student belongs to."
          table="departments"
          rows={data.departments as Row[]}
        />

        <ReferenceList
          title="Universities and boards"
          description="Sits under a department."
          table="department_sub_sections"
          rows={data.subSections as Row[]}
          parents={data.departments as Row[]}
          parentLabel="Department"
        />

        <ReferenceList
          title="Sessions"
          description="Admission years, e.g. 2026-27."
          table="sessions"
          rows={data.sessions as Row[]}
        />

        <ReferenceList
          title="Courses"
          description="What the consultancy sells — separate from the public catalogue."
          table="courses"
          rows={data.courses as Row[]}
        />

        <ReferenceList
          title="Sub courses"
          description="Streams or standards under a course."
          table="sub_courses"
          rows={data.subCourses as Row[]}
          parents={data.courses as Row[]}
          parentLabel="Course"
        />

        <CrmSection
          title="Lead form fields"
          description="Hide a field or make it required. System fields map to real columns and cannot be removed."
        >
          <ul className="grid gap-2">
            {data.fields.map((field) => (
              <li key={field.id} className="rounded-lg border p-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="font-medium text-ink">
                    {field.label}
                    <span className="ml-2 text-sm font-normal text-muted-foreground">
                      {field.field_key}
                    </span>
                  </span>
                  <span className="flex gap-1">
                    {field.is_required ? <Badge variant="urgent" size="sm">Required</Badge> : null}
                    <Badge variant={field.is_active ? "success" : "outline"} size="sm">
                      {field.is_active ? "Shown" : "Hidden"}
                    </Badge>
                  </span>
                </div>
                <div className="mt-2">
                  <Disclosure label="Edit">
                    <ActionForm
                      action={saveFormField}
                      submitLabel="Save field"
                      hidden={{ id: field.id as string }}
                      fields={[
                        { name: "label", label: "Label", required: true, defaultValue: field.label as string },
                        {
                          name: "display_order", label: "Order", type: "number", min: "0",
                          defaultValue: field.display_order as number,
                        },
                        { name: "is_required", label: "Required", type: "checkbox", defaultValue: field.is_required ? "1" : "" },
                        { name: "is_active", label: "Shown on the form", type: "checkbox", defaultValue: field.is_active ? "1" : "" },
                      ]}
                    />
                  </Disclosure>
                </div>
              </li>
            ))}
          </ul>
        </CrmSection>
      </div>
    </div>
  );
}

function ReferenceList({
  title,
  description,
  table,
  rows,
  parents,
  parentLabel,
}: {
  title: string;
  description: string;
  table: string;
  rows: Row[];
  parents?: Row[];
  parentLabel?: string;
}) {
  return (
    <CrmSection title={title} description={description}>
      {rows.length === 0 ? (
        <p className="text-body">Nothing here yet.</p>
      ) : (
        <ul className="grid gap-1">
          {rows.map((row) => (
            <li key={row.id} className="flex items-center justify-between gap-3 rounded-lg px-2 py-1.5 hover:bg-surface">
              <span className={row.is_active ? "text-ink" : "text-muted-foreground line-through"}>
                {row.name}
              </span>
              <ActionButton
                action={toggleReferenceRow}
                payload={{ table, id: row.id, is_active: row.is_active ? "false" : "true" }}
                variant="ghost"
              >
                {row.is_active ? "Hide" : "Show"}
              </ActionButton>
            </li>
          ))}
        </ul>
      )}

      <div className="mt-4">
        <Disclosure label={`Add to ${title.toLowerCase()}`}>
          <ActionForm
            action={saveReferenceRow}
            submitLabel="Add"
            columns={1}
            hidden={{ table }}
            fields={[
              { name: "name", label: "Name", required: true },
              ...(parents
                ? ([{
                    name: "parent_id",
                    label: parentLabel ?? "Parent",
                    type: "select" as const,
                    required: true,
                    options: parents.map((p) => ({ value: p.id, label: p.name })),
                  }])
                : []),
              { name: "is_active", label: "Active", type: "checkbox", defaultValue: "1" },
            ]}
          />
        </Disclosure>
      </div>
    </CrmSection>
  );
}
