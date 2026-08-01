import Link from "next/link";

import { ArrowRight, CalendarDays, Laptop } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import type { UpcomingExam } from "@/lib/queries/home";

const LEVEL_LABEL: Record<string, string> = {
  after_10: "After 10th",
  after_12: "After 12th",
  ug: "Undergraduate",
  pg: "Postgraduate",
  diploma: "Diploma",
  doctorate: "Doctorate",
  certificate: "Certificate",
};

/** Formats `2027-01-24` as `24 Jan 2027` without pulling in a date library. */
function formatExamDate(value: string | null) {
  if (!value) return null;
  const date = new Date(`${value}T00:00:00Z`);
  if (Number.isNaN(date.getTime())) return null;
  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(date);
}

/** §5.1 item 10 card. */
export function ExamCard({ exam }: { exam: UpcomingExam }) {
  const examDate = formatExamDate(exam.exam_date);
  const applyBy = formatExamDate(exam.application_end);

  return (
    <article className="card-lift relative flex h-full flex-col rounded-xl border bg-card p-4">
      <div className="flex items-start justify-between gap-2">
        <h3 className="text-base font-semibold text-ink">
          <Link
            href={`/exams/${exam.slug}`}
            className="after:absolute after:inset-0 hover:text-brand-blue focus-visible:outline-none"
          >
            {exam.name}
          </Link>
        </h3>
        {exam.level ? (
          <Badge variant="secondary" size="sm" className="shrink-0">
            {LEVEL_LABEL[exam.level] ?? exam.level}
          </Badge>
        ) : null}
      </div>

      {exam.conducting_body ? (
        <p className="mt-1 line-clamp-1 text-sm text-muted-foreground">
          {exam.conducting_body}
        </p>
      ) : null}

      <dl className="mt-3 space-y-1.5 text-sm">
        {examDate ? (
          <div className="flex items-center gap-2">
            <CalendarDays className="size-3.5 shrink-0 text-brand-blue-400" aria-hidden />
            <dt className="sr-only">Exam date</dt>
            <dd className="text-body tabular-nums">{examDate}</dd>
          </div>
        ) : null}
        {exam.mode ? (
          <div className="flex items-center gap-2">
            <Laptop className="size-3.5 shrink-0 text-brand-blue-400" aria-hidden />
            <dt className="sr-only">Mode</dt>
            <dd className="line-clamp-1 text-body">{exam.mode}</dd>
          </div>
        ) : null}
      </dl>

      {applyBy ? (
        <p className="mt-3 text-sm text-muted-foreground tabular-nums">
          Apply by {applyBy}
        </p>
      ) : null}

      <span className="mt-auto inline-flex items-center gap-1 pt-4 text-sm font-semibold text-brand-blue-400">
        Check Details
        <ArrowRight className="size-4" aria-hidden />
      </span>
    </article>
  );
}
