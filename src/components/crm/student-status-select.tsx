"use client";

import { useRouter } from "next/navigation";
import * as React from "react";

import { setStudentStatus } from "@/app/(admin)/admin/crm/actions";
import {
  CRM_STUDENT_STATUSES,
  CRM_STUDENT_STATUS_LABELS,
  type CrmStudentStatus,
} from "@/config/crm";

/**
 * A student arrives as `pending` — this is where an admin approves them into
 * `active`. Dropping asks for a reason, because "dropped" with no explanation
 * is useless three months later.
 */
export function StudentStatusSelect({
  id,
  status,
}: {
  id: string;
  status: CrmStudentStatus;
}) {
  const router = useRouter();
  const [value, setValue] = React.useState(status);
  const [pending, startTransition] = React.useTransition();
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => setValue(status), [status]);

  const onChange = (next: CrmStudentStatus) => {
    const previous = value;
    let reason = "";

    if (next === "dropped") {
      const typed = window.prompt("Why is this student dropping out?");
      if (!typed?.trim()) return;
      reason = typed.trim();
    }

    setValue(next);
    setError(null);

    startTransition(async () => {
      const form = new FormData();
      form.set("id", id);
      form.set("status", next);
      if (reason) form.set("drop_reason", reason);

      const result = await setStudentStatus(form);
      if (!result.ok) {
        setValue(previous);
        setError(result.error ?? "That did not work.");
        return;
      }
      router.refresh();
    });
  };

  return (
    <div className="grid gap-1">
      <select
        value={value}
        disabled={pending}
        onChange={(event) => onChange(event.target.value as CrmStudentStatus)}
        aria-label="Student status"
        className="h-10 w-[190px] rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:opacity-60"
      >
        {CRM_STUDENT_STATUSES.map((option) => (
          <option key={option} value={option}>
            {CRM_STUDENT_STATUS_LABELS[option]}
          </option>
        ))}
      </select>
      {error ? (
        <span role="alert" className="text-sm font-medium text-destructive">
          {error}
        </span>
      ) : null}
    </div>
  );
}
