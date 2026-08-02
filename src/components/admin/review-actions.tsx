"use client";

import { useRouter } from "next/navigation";
import * as React from "react";

import { Check, Loader2, Undo2, X } from "lucide-react";

import {
  approveReview,
  rejectReview,
  unapproveReview,
} from "@/app/(admin)/admin/reviews/actions";
import { Button } from "@/components/ui/button";

/** Approve / reject controls for one review (§5.5). */
export function ReviewActions({
  id,
  approved,
}: {
  id: string;
  approved: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = React.useTransition();
  const [error, setError] = React.useState<string | null>(null);

  const run = (
    action: (formData: FormData) => Promise<{ ok: boolean; error?: string }>,
    confirmMessage?: string,
  ) => {
    // Rejection deletes the row — worth one confirmation, it is not undoable.
    if (confirmMessage && !window.confirm(confirmMessage)) return;

    const formData = new FormData();
    formData.set("id", id);
    setError(null);

    startTransition(async () => {
      const result = await action(formData);
      if (!result.ok) {
        setError(result.error ?? "That did not work.");
        return;
      }
      router.refresh();
    });
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      {approved ? (
        <Button
          variant="outline"
          size="sm"
          disabled={pending}
          onClick={() => run(unapproveReview)}
        >
          {pending ? <Loader2 className="animate-spin" /> : <Undo2 />}
          Unpublish
        </Button>
      ) : (
        <>
          <Button size="sm" disabled={pending} onClick={() => run(approveReview)}>
            {pending ? <Loader2 className="animate-spin" /> : <Check />}
            Approve
          </Button>
          <Button
            variant="destructive"
            size="sm"
            disabled={pending}
            onClick={() =>
              run(rejectReview, "Delete this review? This cannot be undone.")
            }
          >
            <X />
            Reject
          </Button>
        </>
      )}

      {error ? (
        <span role="alert" className="text-sm font-medium text-destructive">
          {error}
        </span>
      ) : null}
    </div>
  );
}
