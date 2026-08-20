"use client";

import { useRouter } from "next/navigation";
import * as React from "react";

import { setLeadStatus } from "@/app/(admin)/admin/crm/actions";
import {
  CRM_LEAD_STATUSES,
  CRM_STATUS_LABELS,
  type CrmLeadStatus,
} from "@/config/crm";

/**
 * Inline status change from the leads table.
 *
 * Optimistic — a counsellor moves dozens of leads a shift and should not wait
 * on a round trip each time. Reverts if the write is refused.
 *
 * Choosing "Custom" prompts for the label, because a custom status with no
 * text is indistinguishable from every other custom status in the list.
 */
export function LeadStatusSelect({
  id,
  status,
  customStatus,
}: {
  id: string;
  status: CrmLeadStatus;
  customStatus?: string | null;
}) {
  const router = useRouter();
  const [value, setValue] = React.useState<CrmLeadStatus>(status);
  const [label, setLabel] = React.useState(customStatus ?? "");
  const [pending, startTransition] = React.useTransition();

  React.useEffect(() => setValue(status), [status]);

  const onChange = (next: CrmLeadStatus) => {
    const previous = value;
    let custom = "";

    if (next === "custom") {
      const typed = window.prompt("Label for this status", label || "");
      if (!typed?.trim()) return;
      custom = typed.trim();
      setLabel(custom);
    }

    setValue(next);
    startTransition(async () => {
      const form = new FormData();
      form.set("id", id);
      form.set("status", next);
      if (custom) form.set("custom_status", custom);

      const result = await setLeadStatus(form);
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
      onChange={(event) => onChange(event.target.value as CrmLeadStatus)}
      aria-label="Lead status"
      className="h-9 w-[168px] rounded-lg border border-input bg-transparent px-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:opacity-60"
    >
      {CRM_LEAD_STATUSES.map((option) => (
        <option key={option} value={option}>
          {option === "custom" && label ? label : CRM_STATUS_LABELS[option]}
        </option>
      ))}
    </select>
  );
}
