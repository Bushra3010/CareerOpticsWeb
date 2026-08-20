"use client";

import { useRouter } from "next/navigation";
import * as React from "react";

import { assignLead } from "@/app/(crm)/crm/actions";

/** Reassign a lead from the table. Optimistic, same reasoning as the status select. */
export function LeadAssignSelect({
  id,
  assignedTo,
  staff,
}: {
  id: string;
  assignedTo: string | null;
  staff: { id: string; name: string }[];
}) {
  const router = useRouter();
  const [value, setValue] = React.useState(assignedTo ?? "");
  const [pending, startTransition] = React.useTransition();

  React.useEffect(() => setValue(assignedTo ?? ""), [assignedTo]);

  const onChange = (next: string) => {
    const previous = value;
    setValue(next);

    startTransition(async () => {
      const form = new FormData();
      form.set("id", id);
      form.set("assigned_to", next);

      const result = await assignLead(form);
      if (!result.ok) {
        setValue(previous);
        return;
      }
      router.refresh();
    });
  };

  return (
    <select
      value={value}
      disabled={pending}
      onChange={(event) => onChange(event.target.value)}
      aria-label="Assigned to"
      className="h-9 w-[150px] rounded-lg border border-input bg-transparent px-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:opacity-60"
    >
      <option value="">Unassigned</option>
      {staff.map((person) => (
        <option key={person.id} value={person.id}>
          {person.name}
        </option>
      ))}
    </select>
  );
}
