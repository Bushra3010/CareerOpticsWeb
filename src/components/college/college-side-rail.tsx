import Link from "next/link";

import { SideRailLeadForm } from "@/components/college/side-rail-lead-form";
import { Rating } from "@/components/ui/rating";
import type { SimilarCollege } from "@/lib/queries/college-detail";
import { initials } from "@/lib/media";

/**
 * §5.3 right rail — sticky counselling form plus similar colleges.
 *
 * The form is rendered inline rather than behind a dialog: this is the
 * highest-intent page on the site, so the field set should be visible without
 * a click.
 */
export function CollegeSideRail({
  collegeId,
  collegeName,
  similar,
}: {
  collegeId: string;
  collegeName: string;
  similar: SimilarCollege[];
}) {
  return (
    <div className="sticky top-32 grid gap-6">
      <section className="rounded-xl border bg-card p-5 shadow-card">
        <h2 className="text-h3">Get Free Counselling</h2>
        <p className="mt-1 text-sm text-body">
          Ask about {collegeName} admission, fees and cut-offs. No charge, no
          obligation.
        </p>
        <SideRailLeadForm collegeId={collegeId} />
      </section>

      {similar.length > 0 ? (
        <section className="rounded-xl border bg-card p-5">
          <h2 className="text-h3">Similar colleges</h2>
          <ul className="mt-3 grid gap-3">
            {similar.map((college) => (
              <li key={college.id}>
                <Link
                  href={`/colleges/${college.slug}`}
                  className="flex items-center gap-3 rounded-lg p-1 hover:bg-brand-blue-50 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
                >
                  <span className="flex size-10 shrink-0 items-center justify-center rounded-lg border bg-white font-display text-sm font-extrabold text-brand-blue">
                    {initials(college.short_name ?? college.name)}
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate font-medium text-ink">
                      {college.name}
                    </span>
                    <span className="flex items-center gap-2 text-sm text-muted-foreground">
                      {college.cities?.name}
                      {college.rating && college.rating > 0 ? (
                        <Rating
                          value={Number(college.rating)}
                          size="sm"
                          showValue={false}
                        />
                      ) : null}
                    </span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}
