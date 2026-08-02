import { Rating } from "@/components/ui/rating";
import type { CollegeReview } from "@/lib/queries/college-detail";

function formatDate(value: string | null) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return new Intl.DateTimeFormat("en-IN", {
    month: "short",
    year: "numeric",
  }).format(date);
}

/** §5.3 — approved reviews only. */
export function ReviewList({ reviews }: { reviews: CollegeReview[] }) {
  if (reviews.length === 0) {
    return (
      <p className="rounded-xl border border-dashed p-6 text-body">
        No reviews yet. If you studied here, yours would be the first — it helps
        the next student more than any brochure.
      </p>
    );
  }

  return (
    <ul className="grid gap-4">
      {reviews.map((review) => {
        const when = formatDate(review.created_at);
        return (
          <li key={review.id} className="rounded-xl border p-5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <Rating value={review.rating ?? 0} size="sm" />
              {when ? (
                <span className="text-sm text-muted-foreground tabular-nums">
                  {when}
                </span>
              ) : null}
            </div>
            {review.title ? (
              <h3 className="mt-2 text-base font-semibold text-ink">
                {review.title}
              </h3>
            ) : null}
            {review.body ? (
              <p className="mt-1 text-pretty text-body">{review.body}</p>
            ) : null}
            <p className="mt-3 text-sm text-muted-foreground">
              {review.name}
              {review.course ? ` · ${review.course}` : ""}
            </p>
          </li>
        );
      })}
    </ul>
  );
}
