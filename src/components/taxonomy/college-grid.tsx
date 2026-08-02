import Link from "next/link";

import { CollegeCard, type CollegeCardData } from "@/components/college/college-card";
import { InlineLeadCard } from "@/components/forms/inline-lead-card";
import { Button } from "@/components/ui/button";

/**
 * Shared college grid for the taxonomy pages. Falls back to the counselling
 * card rather than an empty section — a stream or city with no partner college
 * yet is exactly where a counsellor adds the most value.
 */
export function CollegeGrid({
  colleges,
  emptyMessage,
  moreHref,
  moreLabel = "See all colleges",
}: {
  colleges: CollegeCardData[];
  emptyMessage: string;
  moreHref?: string;
  moreLabel?: string;
}) {
  if (colleges.length === 0) {
    return (
      <>
        <p className="mb-4 rounded-xl border border-dashed p-6 text-body">
          {emptyMessage}
        </p>
        <InlineLeadCard />
      </>
    );
  }

  return (
    <>
      <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {colleges.map((college) => (
          <li key={college.id}>
            <CollegeCard college={college} />
          </li>
        ))}
      </ul>
      {moreHref ? (
        <div className="mt-6">
          <Button asChild variant="outline">
            <Link href={moreHref}>{moreLabel}</Link>
          </Button>
        </div>
      ) : null}
    </>
  );
}
