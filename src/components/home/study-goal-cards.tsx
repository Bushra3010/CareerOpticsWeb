import Link from "next/link";

import { ArrowRight, ChevronRight, Star } from "lucide-react";

import { ScrollRow } from "@/components/home/scroll-row";
import { StreamIcon } from "@/components/home/stream-icon";
import type { StudyGoal } from "@/lib/queries/home";

/**
 * Colour-coded accents for the cards. Five accents rotate across the nine
 * featured streams, so no two neighbours ever share a colour. Each class is
 * written out in full rather than composed from a string, because Tailwind only
 * emits utilities it can see statically.
 */
const ACCENTS = [
  {
    text: "text-stream-violet",
    tint: "bg-stream-violet-tint",
    dot: "bg-stream-violet",
    border: "border-stream-violet",
    solid: "bg-stream-violet text-white hover:bg-stream-violet/90",
    outline:
      "border-stream-violet text-stream-violet hover:bg-stream-violet-tint",
  },
  {
    text: "text-stream-orange",
    tint: "bg-stream-orange-tint",
    dot: "bg-stream-orange",
    border: "border-stream-orange",
    solid: "bg-stream-orange text-white hover:bg-stream-orange/90",
    outline:
      "border-stream-orange text-stream-orange hover:bg-stream-orange-tint",
  },
  {
    text: "text-stream-green",
    tint: "bg-stream-green-tint",
    dot: "bg-stream-green",
    border: "border-stream-green",
    solid: "bg-stream-green text-white hover:bg-stream-green/90",
    outline: "border-stream-green text-stream-green hover:bg-stream-green-tint",
  },
  {
    text: "text-stream-blue",
    tint: "bg-stream-blue-tint",
    dot: "bg-stream-blue",
    border: "border-stream-blue",
    solid: "bg-stream-blue text-white hover:bg-stream-blue/90",
    outline: "border-stream-blue text-stream-blue hover:bg-stream-blue-tint",
  },
  {
    text: "text-stream-pink",
    tint: "bg-stream-pink-tint",
    dot: "bg-stream-pink",
    border: "border-stream-pink",
    solid: "bg-stream-pink text-white hover:bg-stream-pink/90",
    outline: "border-stream-pink text-stream-pink hover:bg-stream-pink-tint",
  },
] as const;

/** §5.1 item 5 — "Select Your Study Goal". */
export function StudyGoalCards({ goals }: { goals: StudyGoal[] }) {
  return (
    <>
      {/* Phones get a compact two-column list: the full cards are 270px wide,
          so on a 375px screen only one fits and the courses inside them are a
          lot of vertical scroll before the next section. */}
      <ul className="grid grid-cols-2 gap-3 lg:hidden">
        {goals.map((goal, index) => {
          const accent = ACCENTS[index % ACCENTS.length]!;
          return (
            <li key={goal.id}>
              <Link
                href={`/streams/${goal.slug}`}
                className="flex h-full items-center gap-2.5 rounded-xl border bg-card p-3 transition-shadow hover:shadow-card focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:outline-none"
              >
                <span
                  className={`flex size-10 shrink-0 items-center justify-center rounded-xl ${accent.tint} ${accent.text}`}
                >
                  <StreamIcon name={goal.icon} className="size-5" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-semibold text-ink">
                    {goal.name}
                  </span>
                  <span className="block text-xs text-muted-foreground tabular-nums">
                    {goal.collegeCount}{" "}
                    {goal.collegeCount === 1 ? "College" : "Colleges"}
                  </span>
                </span>
                <ChevronRight
                  className="size-4 shrink-0 text-muted-foreground"
                  aria-hidden
                />
              </Link>
            </li>
          );
        })}
      </ul>

      <div className="hidden lg:block">
        <ScrollRow label="Study goals" dots className="pt-4">
          {goals.map((goal, index) => {
            const accent = ACCENTS[index % ACCENTS.length]!;
            // The first card is the highest sort_order stream, so the badge marks a
            // real editorial ranking rather than an arbitrary highlight.
            const featured = index === 0;

            return (
              <article
                key={goal.id}
                className={`card-lift relative flex w-[270px] shrink-0 snap-start flex-col rounded-2xl bg-card p-5 pt-7 ${
                  featured ? `border-2 ${accent.border}` : "border"
                }`}
              >
            {featured ? (
              <span
                className={`absolute -top-3 left-1/2 flex -translate-x-1/2 items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold whitespace-nowrap text-white ${accent.dot}`}
              >
                <Star className="size-3 fill-current" aria-hidden />
                Popular Choice
              </span>
            ) : null}

            <span
              className={`flex size-14 items-center justify-center rounded-2xl ${accent.tint} ${accent.text}`}
            >
              <StreamIcon name={goal.icon} className="size-6" />
            </span>

            <h3 className="mt-4 text-h3">
              <Link
                href={`/streams/${goal.slug}`}
                className="after:absolute after:inset-0 hover:text-brand-blue focus-visible:outline-none"
              >
                {goal.name}
              </Link>
            </h3>
            <p
              className={`mt-1 text-sm font-semibold tabular-nums ${accent.text}`}
            >
              {goal.collegeCount}{" "}
              {goal.collegeCount === 1 ? "College" : "Colleges"}
            </p>

            <p className="mt-4 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
              Popular Courses
            </p>
            <ul className="mt-2 flex flex-col gap-2">
              {goal.courses.map((course) => (
                <li key={course.slug} className="flex items-center gap-2">
                  <span
                    className={`size-1.5 shrink-0 rounded-full ${accent.dot}`}
                    aria-hidden
                  />
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
              className={`relative z-10 mt-5 inline-flex h-10 items-center justify-center gap-1.5 rounded-lg border-2 text-sm font-semibold transition-colors focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:outline-none ${
                featured ? `border-transparent ${accent.solid}` : accent.outline
              }`}
            >
              Explore
              <ArrowRight className="size-4" aria-hidden />
            </Link>
          </article>
        );
      })}
    </ScrollRow>
      </div>
    </>
  );
}
