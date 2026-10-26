"use client";

import dynamic from "next/dynamic";
import * as React from "react";

import { Slot } from "radix-ui";

const LoginChooserContent = dynamic(
  () =>
    import("@/components/site/login-chooser-content").then(
      (m) => m.LoginChooserContent,
    ),
  { ssr: false },
);

/**
 * Wraps a trigger in the portal Login chooser (staff, student, associate).
 * Same lazy pattern as `LeadDialog`: the dialog is fetched on first click, so
 * the header pays for a click handler, not a modal (§11).
 */
export function LoginChooser({ children }: { children: React.ReactElement }) {
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
      {loaded ? <LoginChooserContent open={open} onOpenChange={setOpen} /> : null}
    </>
  );
}
