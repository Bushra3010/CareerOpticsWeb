import Link from "next/link";

import { ArrowRight } from "lucide-react";

import { ScrollRow } from "@/components/home/scroll-row";
import { StreamIcon } from "@/components/home/stream-icon";
import type { StudyGoal } from "@/lib/queries/home";

/** §5.1 item 5 — "Select Your Study Goal". */
export function StudyGoalCards({ goals }: { goals: StudyGoal[] }) {
  return (
    <ScrollRow label="Study goals">
      {goals.map((goal) => (
        <article
          key={goal.id}
          className="card-lift relative flex w-[248px] shrink-0 snap-start flex-col rounded-xl border bg-card p-5"
        >
          <span className="flex size-11 items-center justify-center rounded-full bg-brand-blue-50 text-brand-blue">
            <StreamIcon name={goal.icon} />
          </span>

          <h3 className="mt-4 text-h3">
            <Link
              href={`/streams/${goal.slug}`}
              className="after:absolute after:inset-0 hover:text-brand-blue focus-visible:outline-none"
            >
              {goal.name}
            </Link>
          </h3>
          <p className="mt-1 text-sm font-semibold text-brand-orange tabular-nums">
            {goal.collegeCount} {goal.collegeCount === 1 ? "College" : "Colleges"}
          </p>

          <ul className="mt-3 flex flex-col gap-1.5">
            {goal.courses.map((course) => (
              <li key={course.slug}>
                <Link
                  href={`/courses/${course.slug}`}
                  className="relative z-10 text-sm text-body hover:text-brand-blue-400 hover:underline focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:outline-none"
                >
                  {course.name}
                </Link>
              </li>
            ))}
          </ul>

          <Link
            href={`/streams/${goal.slug}`}
            aria-label={`Explore ${goal.name} colleges`}
            className="relative z-10 mt-auto inline-flex items-center gap-1 pt-4 text-sm font-semibold text-brand-blue-400 hover:underline focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:outline-none"
          >
            Explore
            <ArrowRight className="size-4" aria-hidden />
          </Link>
        </article>
      ))}
    </ScrollRow>
  );
}
