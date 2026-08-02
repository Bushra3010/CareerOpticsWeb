import Link from "next/link";

import { LeadDialog } from "@/components/forms/lead-dialog";
import { Button } from "@/components/ui/button";
import type { CollegeCourse } from "@/lib/queries/college-detail";
import { formatInr } from "@/lib/media";

/** `48` → `4 years`, `18` → `1 yr 6 mo`. */
function formatDuration(months: number | null) {
  if (!months || months <= 0) return null;
  const years = Math.floor(months / 12);
  const rest = months % 12;
  if (years && rest) return `${years} yr ${rest} mo`;
  if (years) return `${years} year${years > 1 ? "s" : ""}`;
  return `${rest} month${rest > 1 ? "s" : ""}`;
}

/** §5.3 — Course · Duration · Eligibility · Fee/Year · Apply. */
export function CoursesFeesTable({
  courses,
  collegeId,
  collegeName,
}: {
  courses: CollegeCourse[];
  collegeId: string;
  collegeName: string;
}) {
  if (courses.length === 0) {
    return (
      <p className="rounded-xl border border-dashed p-6 text-body">
        Course and fee details for this college are being verified. Ask a
        counsellor and we will send you the current fee structure.
      </p>
    );
  }

  return (
    // Wider than a phone, so it scrolls in its own container (§6.3).
    <div className="overflow-x-auto rounded-xl border">
      <table className="w-full min-w-[720px] border-collapse text-left">
        <caption className="sr-only">Courses and fees at {collegeName}</caption>
        <thead className="bg-surface">
          <tr>
            <th scope="col" className="p-3 text-sm font-semibold text-ink">Course</th>
            <th scope="col" className="p-3 text-sm font-semibold text-ink">Duration</th>
            <th scope="col" className="p-3 text-sm font-semibold text-ink">Eligibility</th>
            <th scope="col" className="p-3 text-sm font-semibold text-ink">Fee / year</th>
            <th scope="col" className="p-3 text-sm font-semibold text-ink">
              <span className="sr-only">Apply</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {courses.map((course) => (
            <tr key={course.id} className="border-t align-top">
              <td className="p-3">
                <Link
                  href={`/courses/${course.slug}`}
                  className="font-semibold text-ink hover:text-brand-blue"
                >
                  {course.name}
                </Link>
                {course.seats ? (
                  <p className="mt-0.5 text-sm text-muted-foreground tabular-nums">
                    {course.seats} seats
                  </p>
                ) : null}
              </td>
              <td className="p-3 text-body tabular-nums">
                {formatDuration(course.durationMonths) ?? "—"}
              </td>
              <td className="max-w-[280px] p-3 text-sm text-body">
                {course.eligibility ?? "—"}
              </td>
              <td className="p-3 font-semibold text-ink tabular-nums">
                {formatInr(course.feePerYear) ?? "On request"}
                {course.totalFee ? (
                  <span className="block text-sm font-normal text-muted-foreground">
                    {formatInr(course.totalFee)} total
                  </span>
                ) : null}
              </td>
              <td className="p-3">
                <LeadDialog
                  source="apply_now"
                  collegeId={collegeId}
                  courseId={course.courseId}
                  title={`Apply for ${course.name}`}
                  description={`A counsellor will confirm eligibility and fees for ${course.name} at ${collegeName}.`}
                  fields={["city", "message"]}
                  submitLabel="Submit Application"
                >
                  <Button size="sm">Apply</Button>
                </LeadDialog>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
