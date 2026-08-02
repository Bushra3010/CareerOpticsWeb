"use client";

import { useRouter } from "next/navigation";
import * as React from "react";

import { Loader2 } from "lucide-react";

import { addLeadNote } from "@/app/(admin)/admin/leads/actions";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

/** §5.5 notes timeline — append a note against a lead. */
export function LeadNoteForm({ leadId }: { leadId: string }) {
  const router = useRouter();
  const formRef = React.useRef<HTMLFormElement>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [pending, startTransition] = React.useTransition();

  const onSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    setError(null);

    startTransition(async () => {
      const result = await addLeadNote(formData);
      if (!result.ok) {
        setError(result.error ?? "Could not save the note.");
        return;
      }
      formRef.current?.reset();
      router.refresh();
    });
  };

  return (
    <form ref={formRef} onSubmit={onSubmit} className="grid gap-2">
      <input type="hidden" name="id" value={leadId} />
      <Label htmlFor="note">Add a note</Label>
      <textarea
        id="note"
        name="note"
        rows={3}
        maxLength={2000}
        required
        placeholder="Called, no answer. Trying again after 6pm."
        className="w-full rounded-lg border border-input bg-transparent px-3 py-2 text-sm outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
      />
      {error ? (
        <p role="alert" className="text-sm font-medium text-destructive">
          {error}
        </p>
      ) : null}
      <Button type="submit" disabled={pending} className="justify-self-start">
        {pending ? (
          <>
            <Loader2 className="animate-spin" />
            Saving…
          </>
        ) : (
          "Save note"
        )}
      </Button>
    </form>
  );
}
