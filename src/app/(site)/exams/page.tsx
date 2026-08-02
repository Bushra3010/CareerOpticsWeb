import type { Metadata } from "next";

import { ExamCard } from "@/components/home/exam-card";
import { InlineLeadCard } from "@/components/forms/inline-lead-card";
import { PageHeader } from "@/components/taxonomy/page-header";
import { getExams } from "@/lib/queries/taxonomy";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Entrance Exams 2026-27 — Dates, Eligibility, Pattern",
  description:
    "Entrance exam calendar for admission in India: exam dates, application windows, eligibility and the colleges that accept each score.",
  alternates: { canonical: "/exams" },
};

/** `/exams` — exam listing (§4). */
export default async function ExamsPage() {
  const exams = await getExams();

  const today = new Date().toISOString().slice(0, 10);
  const upcoming = exams.filter((exam) => exam.exam_date && exam.exam_date >= today);
  const past = exams.filter((exam) => !exam.exam_date || exam.exam_date < today);

  return (
    <>
      <PageHeader
        crumbs={[{ name: "Exams" }]}
        title="Entrance Exams"
        description="Dates, application windows and eligibility for the entrance exams that lead into the colleges we cover."
      />

      <div className="container-site py-8 lg:py-12">
        {upcoming.length > 0 ? (
          <section aria-labelledby="upcoming-title">
            <h2 id="upcoming-title" className="heading-underline text-h2">
              Upcoming exams
            </h2>
            <ul className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {upcoming.map((exam) => (
                <li key={exam.id}>
                  <ExamCard exam={exam} />
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        <div className="py-8">
          <InlineLeadCard />
        </div>

        {past.length > 0 ? (
          <section aria-labelledby="past-title">
            <h2 id="past-title" className="heading-underline text-h2">
              {upcoming.length > 0 ? "Past sessions" : "All exams"}
            </h2>
            <p className="mt-4 text-body">
              Dates for the next cycle are usually announced a few months ahead.
            </p>
            <ul className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {past.map((exam) => (
                <li key={exam.id}>
                  <ExamCard exam={exam} />
                </li>
              ))}
            </ul>
          </section>
        ) : null}
      </div>
    </>
  );
}
