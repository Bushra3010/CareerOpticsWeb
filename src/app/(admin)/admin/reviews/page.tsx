import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { ReviewActions } from "@/components/admin/review-actions";
import { Badge } from "@/components/ui/badge";
import { Rating } from "@/components/ui/rating";
import { can, requireStaff } from "@/lib/auth";
import { listReviews, type AdminReview } from "@/lib/queries/admin";

export const metadata: Metadata = {
  title: "Reviews",
  robots: { index: false, follow: false },
};

function formatWhen(value: string | null) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat("en-IN", { dateStyle: "medium" }).format(date);
}

/** `/admin/reviews` — approve/reject queue (§5.5). */
export default async function AdminReviewsPage() {
  const profile = await requireStaff();
  if (!can(profile.role, "content")) redirect("/admin");

  const [pending, approved] = await Promise.all([
    listReviews(false),
    listReviews(true),
  ]);

  return (
    <div>
      <h1 className="text-h2">Reviews</h1>
      <p className="mt-1 max-w-2xl text-body">
        Nothing a student submits is visible until it is approved here.
        Approving also recomputes that college&apos;s public rating.
      </p>

      <section className="mt-8">
        <h2 className="flex items-center gap-2 text-h3">
          Awaiting moderation
          <Badge variant={pending.length > 0 ? "urgent" : "outline"} size="sm">
            {pending.length}
          </Badge>
        </h2>

        {pending.length === 0 ? (
          <p className="mt-4 rounded-xl border border-dashed p-6 text-body">
            Nothing waiting. New reviews land here as students submit them.
          </p>
        ) : (
          <ul className="mt-4 grid gap-4">
            {pending.map((review) => (
              <li key={review.id}>
                <ReviewCard review={review} />
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="mt-10">
        <h2 className="flex items-center gap-2 text-h3">
          Published
          <Badge variant="outline" size="sm">
            {approved.length}
          </Badge>
        </h2>

        {approved.length === 0 ? (
          <p className="mt-4 rounded-xl border border-dashed p-6 text-body">
            No published reviews yet. Until there are, every college shows its
            seeded rating and no star aggregate is emitted to search engines.
          </p>
        ) : (
          <ul className="mt-4 grid gap-4">
            {approved.map((review) => (
              <li key={review.id}>
                <ReviewCard review={review} />
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function ReviewCard({ review }: { review: AdminReview }) {
  return (
    <article className="rounded-xl border bg-card p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-3">
            <Rating value={review.rating ?? 0} size="sm" />
            <span className="text-sm text-muted-foreground tabular-nums">
              {formatWhen(review.created_at)}
            </span>
          </div>

          {review.colleges?.slug ? (
            <Link
              href={`/colleges/${review.colleges.slug}`}
              target="_blank"
              className="mt-1 block text-sm font-semibold text-brand-blue-400 hover:underline"
            >
              {review.colleges.name}
            </Link>
          ) : null}
        </div>

        <ReviewActions id={review.id} approved={Boolean(review.is_approved)} />
      </div>

      {review.title ? (
        <h3 className="mt-3 text-base font-semibold text-ink">{review.title}</h3>
      ) : null}
      {review.body ? (
        <p className="mt-1 text-pretty text-body">{review.body}</p>
      ) : null}

      <p className="mt-3 text-sm text-muted-foreground">
        {review.name}
        {review.course ? ` · ${review.course}` : ""}
        {review.email ? ` · ${review.email}` : ""}
      </p>
    </article>
  );
}
