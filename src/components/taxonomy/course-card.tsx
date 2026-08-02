import Link from "next/link";

import { ArrowRight, Clock } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { LEVEL_LABELS, type CourseListItem } from "@/lib/queries/taxonomy";
import { formatInr } from "@/lib/media";

/** `48` → `4 years`. Shared with the college Courses & Fees table's phrasing. */
export function formatDuration(months: number | null) {
  if (!months || months <= 0) return null;
  const years = Math.floor(months / 12);
  const rest = months % 12;
  if (years && rest) return `${years} yr ${rest} mo`;
  if (years) return `${years} year${years > 1 ? "s" : ""}`;
  return `${rest} month${rest > 1 ? "s" : ""}`;
}

/** Fee band shown as a range, or a single figure when both ends match. */
export function formatFeeRange(min: number | null, max: number | null) {
  const low = formatInr(min);
  const high = formatInr(max);
  if (low && high) return low === high ? low : `${low} – ${high}`;
  return low ?? high ?? null;
}

/** Card used by `/courses`, the stream hubs and the level hubs. */
export function CourseCard({ course }: { course: CourseListItem }) {
  const duration = formatDuration(course.duration_months);
  const fees = formatFeeRange(course.avg_fee_min, course.avg_fee_max);

  return (
    <article className="card-lift relative flex h-full flex-col rounded-xl border bg-card p-5">
      <div className="flex items-start justify-between gap-2">
        <h3 className="text-h3">
          <Link
            href={`/courses/${course.slug}`}
            className="after:absolute after:inset-0 hover:text-brand-blue focus-visible:outline-none"
          >
            {course.short_name ?? course.name}
          </Link>
        </h3>
        {course.level ? (
          <Badge variant="secondary" size="sm" className="shrink-0">
            {LEVEL_LABELS[course.level] ?? course.level}
          </Badge>
        ) : null}
      </div>

      {course.short_name && course.short_name !== course.name ? (
        <p className="mt-1 text-sm text-muted-foreground">{course.name}</p>
      ) : null}

      {course.description ? (
        <p className="mt-2 line-clamp-2 text-sm text-body">{course.description}</p>
      ) : null}

      <dl className="mt-4 flex flex-wrap gap-x-6 gap-y-2 text-sm">
        {duration ? (
          <div className="flex items-center gap-1.5">
            <Clock className="size-3.5 shrink-0 text-brand-blue-400" aria-hidden />
            <dt className="sr-only">Duration</dt>
            <dd className="text-body tabular-nums">{duration}</dd>
          </div>
        ) : null}
        {fees ? (
          <div>
            <dt className="sr-only">Average fees</dt>
            <dd className="font-semibold text-ink tabular-nums">{fees}</dd>
          </div>
        ) : null}
      </dl>

      <span className="mt-auto inline-flex items-center gap-1 pt-4 text-sm font-semibold text-brand-blue-400">
        View colleges
        <ArrowRight className="size-4" aria-hidden />
      </span>
    </article>
  );
}
