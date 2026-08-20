"use client";

import { useRouter } from "next/navigation";
import * as React from "react";

import { CalendarClock, Loader2, StickyNote } from "lucide-react";

import { addLeadNote, setFollowUp } from "@/app/(crm)/crm/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

/**
 * The two things a counsellor does after every call: leave a note and set the
 * next follow-up. Kept together and above the timeline so the whole loop is
 * one glance and two clicks.
 */
export function LeadActionsPanel({
  leadId,
  followUp,
}: {
  leadId: string;
  followUp: string | null;
}) {
  const router = useRouter();
  const [pending, startTransition] = React.useTransition();
  const [error, setError] = React.useState<string | null>(null);
  const noteRef = React.useRef<HTMLTextAreaElement>(null);

  const run = (
    action: (form: FormData) => Promise<{ ok: boolean; error?: string }>,
    form: FormData,
    after?: () => void,
  ) => {
    setError(null);
    startTransition(async () => {
      const result = await action(form);
      if (!result.ok) {
        setError(result.error ?? "That did not work.");
        return;
      }
      after?.();
      router.refresh();
    });
  };

  return (
    <div className="grid gap-5">
      <form
        onSubmit={(event) => {
          event.preventDefault();
          const form = new FormData(event.currentTarget);
          form.set("id", leadId);
          run(addLeadNote, form, () => {
            if (noteRef.current) noteRef.current.value = "";
          });
        }}
        className="grid gap-2"
      >
        <Label htmlFor="crm-note" className="flex items-center gap-1.5">
          <StickyNote className="size-4 text-brand-blue-400" aria-hidden />
          Log a call
        </Label>
        <textarea
          ref={noteRef}
          id="crm-note"
          name="note"
          rows={3}
          required
          maxLength={2000}
          placeholder="Spoke to the father. Wants the Patna campus, will decide after results."
          className="w-full rounded-lg border border-input bg-transparent px-3 py-2 text-sm outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
        />
        <Button type="submit" size="sm" disabled={pending} className="justify-self-start">
          {pending ? <Loader2 className="animate-spin" /> : null}
          Save note
        </Button>
      </form>

      <form
        onSubmit={(event) => {
          event.preventDefault();
          const form = new FormData(event.currentTarget);
          form.set("id", leadId);
          run(setFollowUp, form);
        }}
        className="grid gap-2 border-t pt-5"
      >
        <Label htmlFor="crm-followup" className="flex items-center gap-1.5">
          <CalendarClock className="size-4 text-brand-blue-400" aria-hidden />
          Next follow-up
        </Label>
        <div className="flex flex-wrap gap-2">
          <Input
            id="crm-followup"
            name="date"
            type="date"
            defaultValue={followUp ?? ""}
            className="h-10 w-[170px]"
          />
          <Button type="submit" size="sm" variant="outline" disabled={pending}>
            Set
          </Button>
          {followUp ? (
            <Button
              type="button"
              size="sm"
              variant="ghost"
              disabled={pending}
              onClick={() => {
                const form = new FormData();
                form.set("id", leadId);
                form.set("date", "");
                run(setFollowUp, form);
              }}
            >
              Clear
            </Button>
          ) : null}
        </div>
        <div className="flex flex-wrap gap-1.5">
          {/* The three intervals that cover almost every callback. */}
          {[
            { label: "Tomorrow", days: 1 },
            { label: "In 3 days", days: 3 },
            { label: "Next week", days: 7 },
          ].map((preset) => (
            <Button
              key={preset.days}
              type="button"
              size="sm"
              variant="ghost"
              disabled={pending}
              className="h-auto px-2 py-1 text-sm"
              onClick={() => {
                const date = new Date();
                date.setDate(date.getDate() + preset.days);
                const form = new FormData();
                form.set("id", leadId);
                form.set("date", date.toISOString().slice(0, 10));
                run(setFollowUp, form);
              }}
            >
              {preset.label}
            </Button>
          ))}
        </div>
      </form>

      {error ? (
        <p role="alert" className="text-sm font-medium text-destructive">
          {error}
        </p>
      ) : null}
    </div>
  );
}
