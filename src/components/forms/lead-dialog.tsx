"use client";

import dynamic from "next/dynamic";
import * as React from "react";

import { Slot } from "radix-ui";

import type { LeadDialogProps } from "@/components/forms/lead-dialog-content";

const LeadDialogContent = dynamic(
  () =>
    import("@/components/forms/lead-dialog-content").then(
      (m) => m.LeadDialogContent,
    ),
  { ssr: false },
);

/**
 * Wraps any trigger element in a lead modal. The dialog and form are fetched
 * on the first open, so a page full of "Apply Now" buttons costs one click
 * handler rather than a form per card (§11).
 *
 * The trigger must be a single element — it is cloned via Radix Slot so the
 * caller keeps full control of how the button looks.
 */
export function LeadDialog({
  children,
  ...props
}: LeadDialogProps & { children: React.ReactElement }) {
  const [open, setOpen] = React.useState(false);
  const [loaded, setLoaded] = React.useState(false);

  return (
    <>
      <Slot.Root
        onClick={() => {
          setLoaded(true);
          setOpen(true);
        }}
      >
        {children}
      </Slot.Root>
      {loaded ? (
        <LeadDialogContent open={open} onOpenChange={setOpen} {...props} />
      ) : null}
    </>
  );
}
