"use client";

import dynamic from "next/dynamic";

import { Skeleton } from "@/components/ui/skeleton";

/**
 * The right-rail counselling form (§5.3) is visible without a click, but it
 * does not need to block first paint: react-hook-form and zod are ~45 kB and
 * nothing above the fold depends on them. It loads right after hydration
 * behind a matching skeleton, which keeps it out of First Load JS (§11).
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

export function SideRailLeadForm({ collegeId }: { collegeId: string }) {
  return (
    <LeadForm
      source="college_detail"
      collegeId={collegeId}
      fields={["city", "level"]}
      className="mt-4"
    />
  );
}
