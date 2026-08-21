import Link from "next/link";

import { CheckCircle2, Info } from "lucide-react";

import { CollegeCard } from "@/components/college/college-card";
import { InlineLeadCard } from "@/components/forms/inline-lead-card";
import { Button } from "@/components/ui/button";
import { DEFAULT_SORT } from "@/config/filters";
import { listColleges } from "@/lib/queries/colleges";
import type { CollegeFilters } from "@/lib/search-params/colleges";

export type FinderAnswerParams = {
  stream?: string;
  course?: string;
  fee?: string;
  state?: string;
  city?: string;
};

function toFilters(params: FinderAnswerParams): CollegeFilters {
  return {
    stream: params.stream ?? "",
    course: params.course ?? "",
    state: params.state ?? "",
    city: params.city ?? "",
    type: [],
    ownership: "",
    naac: [],
    approvals: [],
    fee: params.fee ? Number(params.fee) : null,
    rating: null,
    sort: DEFAULT_SORT,
    page: 1,
  };
}

/**
 * Progressive relaxation, widest constraint dropped last.
 *
 * A student who answered six questions should never land on "no results" — the
 * honest response is a shortlist plus a plain note about which preference we
 * had to widen, not an empty page.
 */
const RELAXATIONS: { drop: (keyof FinderAnswerParams)[]; note: string | null }[] = [
  { drop: [], note: null },
  { drop: ["city"], note: "widened from your city to the whole state" },
  { drop: ["city", "state"], note: "widened beyond your preferred state" },
  {
    drop: ["city", "state", "fee"],
    note: "widened beyond your state and budget",
  },
  {
    drop: ["city", "state", "fee", "course"],
    note: "widened to the whole stream, beyond your state and budget",
  },
];

/** §5.4 — the matched college list shown after the wizard converts. */
export async function FinderResults({ params }: { params: FinderAnswerParams }) {
  let matches: Awaited<ReturnType<typeof listColleges>> | null = null;
  let note: string | null = null;

  const results = await Promise.all(
    RELAXATIONS.map(async (attempt) => {
      const narrowed = { ...params };
      for (const key of attempt.drop) delete narrowed[key];
      return { attempt, result: await listColleges(toFilters(narrowed)) };
    }),
  );

  for (const { attempt, result } of results) {
    if (result.colleges.length > 0) {
      matches = result;
      note = attempt.note;
      break;
    }
  }

  const colleges = matches?.colleges.slice(0, 9) ?? [];
  const total = matches?.total ?? colleges.length;

  return (
    <div className="mx-auto max-w-5xl">
      <div className="rounded-xl border border-success/30 bg-success/5 p-6">
        <CheckCircle2 className="size-8 text-success" aria-hidden />
        <h2 className="mt-3 text-h3">Your shortlist is ready</h2>
        <p className="mt-1 text-body">
          A counsellor has your answers and will call within 24 hours on working
          days to walk through these options.
        </p>
      </div>

      {colleges.length > 0 ? (
        <>
          {note ? (
            <p className="mt-6 flex items-start gap-2 rounded-lg bg-brand-orange/10 p-3 text-sm text-ink">
              <Info className="mt-0.5 size-4 shrink-0" aria-hidden />
              Nothing matched every preference exactly, so this shortlist is{" "}
              {note}.
            </p>
          ) : null}

          <h3 className="mt-8 text-h3">
            {total === 1
              ? "1 college matches your answers"
              : `${total} colleges match your answers`}
          </h3>

          <ul className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {colleges.map((college) => (
              <li key={college.id}>
                <CollegeCard college={college} />
              </li>
            ))}
          </ul>

          <div className="mt-6 flex flex-wrap gap-3">
            <Button asChild variant="outline">
              <Link
                href={`/colleges?${new URLSearchParams(
                  Object.entries(params).filter(([, v]) => v) as [string, string][],
                )}`}
              >
                See all matching colleges
              </Link>
            </Button>
            <Button asChild variant="ghost">
              <Link href="/college-finder">Start over</Link>
            </Button>
          </div>
        </>
      ) : (
        <div className="mt-6">
          <p className="mb-4 rounded-xl border border-dashed p-6 text-body">
            Nothing in our current list matches these answers. That usually means
            the course is one we are still mapping — a counsellor will find it
            for you.
          </p>
          <InlineLeadCard />
        </div>
      )}
    </div>
  );
}
