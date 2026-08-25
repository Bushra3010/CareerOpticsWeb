import Link from "next/link";

import { StreamIcon } from "@/components/home/stream-icon";
import type { StudyGoal } from "@/lib/queries/home";

/**
 * §5.1 item 5 — "Select Your Study Goal".
 *
 * A flat grid of equal tiles rather than the previous horizontal rail of detail
 * cards: every stream is visible at once, there is nothing to scroll past on
 * desktop, and the same markup serves both breakpoints instead of shipping a
 * separate mobile list and desktop carousel.
 *
 * The soft disc behind each label is the pattern's flourish; the stream icon
 * sits inside it so the decoration carries meaning rather than being a blob.
 *
 * The first tile is the highest `sort_order` stream, so its solid fill marks a
 * real editorial ranking — the same signal the old "Popular Choice" badge
 * carried — rather than an arbitrary highlight.
 */
export function StudyGoalCards({ goals }: { goals: StudyGoal[] }) {
  return (
    <ul className="grid grid-cols-2 gap-3 pt-2 sm:gap-4 lg:grid-cols-4">
      {goals.map((goal, index) => {
        const featured = index === 0;

        return (
          <li key={goal.id}>
            <Link
              href={`/streams/${goal.slug}`}
              className={`group relative flex h-full min-h-[104px] items-center overflow-hidden rounded-xl border px-4 py-5 transition-colors focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:outline-none sm:min-h-[128px] sm:px-5 ${
                featured
                  ? "border-brand-blue bg-brand-blue"
                  : "border-border bg-card hover:border-brand-blue hover:bg-brand-blue"
              }`}
            >
              {/* Offset so the label overlaps the disc's right edge. */}
              <span
                aria-hidden
                className={`absolute top-1/2 left-3 flex size-11 -translate-y-1/2 items-center justify-center rounded-full transition-colors sm:left-4 sm:size-14 ${
                  featured
                    ? "bg-white/15 text-white"
                    : "bg-brand-blue-50 text-brand-blue group-hover:bg-white/15 group-hover:text-white"
                }`}
              >
                <StreamIcon name={goal.icon} className="size-5 sm:size-6" />
              </span>

              <span className="relative z-10 pl-7 sm:pl-10">
                <span
                  className={`font-display block text-base leading-tight font-bold transition-colors sm:text-h3 ${
                    featured ? "text-white" : "text-ink group-hover:text-white"
                  }`}
                >
                  {goal.name}
                </span>
                <span
                  className={`mt-1 block text-sm font-semibold tabular-nums transition-colors ${
                    featured
                      ? "text-white/80"
                      : "text-muted-foreground group-hover:text-white/80"
                  }`}
                >
                  {goal.collegeCount}{" "}
                  {goal.collegeCount === 1 ? "College" : "Colleges"}
                </span>
              </span>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
