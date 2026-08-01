"use client";

import dynamic from "next/dynamic";
import * as React from "react";

import { PhoneCall } from "lucide-react";

const LeadDialogContent = dynamic(
  () =>
    import("@/components/forms/lead-dialog-content").then(
      (m) => m.LeadDialogContent,
    ),
  { ssr: false },
);

/**
 * §5.1 floating UI — pulsing "Counsellor Call" widget, bottom-right.
 *
 * Sits above the mobile sticky bar and clear of the bottom-left WhatsApp FAB.
 * The pulse is a ring behind the button so it never moves the hit target, and
 * `motion-reduce` drops it for §6.3.
 */
export function CallbackWidget() {
  const [open, setOpen] = React.useState(false);
  const [loaded, setLoaded] = React.useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => {
          setLoaded(true);
          setOpen(true);
        }}
        aria-label="Request a callback from a counsellor"
        className="fixed right-4 bottom-18 z-40 inline-flex size-12 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-card-hover transition-colors hover:bg-brand-red-600 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:outline-none lg:bottom-6"
      >
        <span
          className="absolute inset-0 animate-ping rounded-full bg-primary/60 motion-reduce:hidden"
          aria-hidden
        />
        <PhoneCall className="relative size-5" aria-hidden />
      </button>

      {loaded ? (
        <LeadDialogContent
          open={open}
          onOpenChange={setOpen}
          source="callback"
          title="Request a callback"
          description="Leave your number and a counsellor will call you within 24 hours on working days."
          fields={["city"]}
          submitLabel="Request Callback"
        />
      ) : null}
    </>
  );
}
