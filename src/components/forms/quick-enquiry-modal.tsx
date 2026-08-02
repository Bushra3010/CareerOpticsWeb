"use client";

import dynamic from "next/dynamic";
import { usePathname } from "next/navigation";
import * as React from "react";

import type { LeadFormOptions } from "@/lib/queries/leads";

const LeadDialogContent = dynamic(
  () =>
    import("@/components/forms/lead-dialog-content").then(
      (m) => m.LeadDialogContent,
    ),
  { ssr: false },
);

/** §5.1 — 25s on mobile, exit-intent on desktop. */
const MOBILE_DELAY_MS = 25_000;
const SESSION_KEY = "careeroptics:quick-enquiry-shown";

/**
 * Routes that are already a lead funnel. Interrupting a student halfway
 * through the College Finder with a second enquiry form costs the conversion
 * we are in the middle of collecting.
 */
const SUPPRESSED_PATHS = ["/college-finder"];

/**
 * Quick Enquiry modal (§5.1 floating UI). Opens once per browser session so a
 * visitor who dismisses it is not nagged on every page.
 *
 * It never interrupts an interaction: exit-intent only fires when the pointer
 * leaves through the top of the window, and neither trigger runs if another
 * dialog already has focus.
 */
export function QuickEnquiryModal({ options }: { options: LeadFormOptions }) {
  const [open, setOpen] = React.useState(false);
  const [loaded, setLoaded] = React.useState(false);
  const pathname = usePathname();

  React.useEffect(() => {
    if (SUPPRESSED_PATHS.some((path) => pathname?.startsWith(path))) return;
    if (sessionStorage.getItem(SESSION_KEY)) return;

    let timer: number | undefined;

    const show = () => {
      // Do not steal focus from a modal or form the visitor is already using.
      if (document.querySelector("[data-slot=dialog-content]")) return;
      const active = document.activeElement;
      if (active instanceof HTMLElement && active.closest("form")) return;

      sessionStorage.setItem(SESSION_KEY, "1");
      setLoaded(true);
      setOpen(true);
      cleanup();
    };

    const onMouseOut = (event: MouseEvent) => {
      if (event.clientY <= 0 && !event.relatedTarget) show();
    };

    const cleanup = () => {
      window.clearTimeout(timer);
      document.removeEventListener("mouseout", onMouseOut);
    };

    const desktop = window.matchMedia("(min-width: 1024px)").matches;
    if (desktop) {
      document.addEventListener("mouseout", onMouseOut);
    } else {
      timer = window.setTimeout(show, MOBILE_DELAY_MS);
    }

    return cleanup;
  }, [pathname]);

  if (!loaded) return null;

  return (
    <LeadDialogContent
      open={open}
      onOpenChange={setOpen}
      source="quick_enquiry"
      title="Get free admission guidance"
      description="Tell us where you are and a counsellor will call you back. No fee, no obligation."
      fields={["college", "level", "course"]}
      courses={options.courses}
      colleges={options.colleges}
      submitLabel="Submit Enquiry"
    />
  );
}
