"use client";

import dynamic from "next/dynamic";

import type { LeadForm as LeadFormType } from "@/components/forms/lead-form";
import { Skeleton } from "@/components/ui/skeleton";

/**
 * A `LeadForm` that is visible without a click but does not block first paint.
 *
 * react-hook-form + zod are ~45 kB. On pages where the form is inline rather
 * than behind a dialog — the college right rail, `/contact` — importing it
 * eagerly puts all of that in First Load JS for a form most visitors never
 * touch. Loading it right after hydration behind a matching skeleton keeps the
 * page inside the §11 budget while still showing the fields unprompted.
 *
 * Use `LeadDialog` instead wherever the form is behind a button.
 */
const LeadForm = dynamic(
  () => import("@/components/forms/lead-form").then((m) => m.LeadForm),
  {
    ssr: false,
    loading: () => (
      <div className="mt-4 grid gap-4" aria-hidden>
        <Skeleton className="h-14 w-full" />
        <Skeleton className="h-14 w-full" />
        <Skeleton className="h-14 w-full" />
        <Skeleton className="h-11 w-full" />
      </div>
    ),
  },
);

export function DeferredLeadForm(props: React.ComponentProps<typeof LeadFormType>) {
  return <LeadForm {...props} />;
}
