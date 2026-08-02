"use client";

import { useRouter } from "next/navigation";
import * as React from "react";

import { updateLeadStatus } from "@/app/(admin)/admin/leads/actions";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { LEAD_STATUSES, STATUS_LABELS, type LeadStatus } from "@/config/leads";

/**
 * Inline status change from the inbox row (§5.5).
 *
 * Optimistic: the select shows the new value immediately and reverts if the
 * server action fails. A counsellor changes status dozens of times a shift and
 * should not wait on a round trip each time.
 */
export function LeadStatusSelect({
  id,
  status,
}: {
  id: string;
  status: LeadStatus;
}) {
  const router = useRouter();
  const [value, setValue] = React.useState<LeadStatus>(status);
  const [pending, startTransition] = React.useTransition();

  // Keep in sync when the server sends a fresher row after revalidation.
  React.useEffect(() => setValue(status), [status]);

  const onChange = (next: string) => {
    const previous = value;
    setValue(next as LeadStatus);

    startTransition(async () => {
      const formData = new FormData();
      formData.set("id", id);
      formData.set("status", next);

      const result = await updateLeadStatus(formData);
      if (!result.ok) {
        setValue(previous);
        return;
      }
      router.refresh();
    });
  };

  return (
    <Select value={value} onValueChange={onChange} disabled={pending}>
      <SelectTrigger className="h-9 w-[152px]" aria-label="Lead status">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {LEAD_STATUSES.map((option) => (
          <SelectItem key={option} value={option}>
            {STATUS_LABELS[option]}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
