import type { Metadata } from "next";
import Link from "next/link";

import { StreamIcon } from "@/components/home/stream-icon";
import { CourseCard } from "@/components/taxonomy/course-card";
import { PageHeader } from "@/components/taxonomy/page-header";
import { Chip } from "@/components/ui/chip";
import { LEVEL_HUBS, getCoursesByStream, getStreamsWithCounts } from "@/lib/queries/taxonomy";

/** §10 — taxonomy pages revalidate hourly. */
export const revalidate = 3600;

export const metadata: Metadata = {
  title: "All Courses — Streams, Fees, Eligibility",
  description:
    "Every course we cover, grouped by stream: eligibility, duration, fee range and the colleges that offer it.",
  alternates: { canonical: "/courses" },
};

/** `/courses` — all courses grid by stream (§4). */
export default async function CoursesPage() {
  const [streams, courses] = await Promise.all([
    getStreamsWithCounts(),
    getCoursesByStream(),
  ]);

  // Only streams that actually have a published course get a section.
  const grouped = streams
    .map((stream) => ({
      stream,
      courses: courses.filter((course) => course.streams?.id === stream.id),
    }))
    .filter((group) => group.courses.length > 0);

  return (
    <>
      <PageHeader
        crumbs={[{ name: "Courses" }]}
        title="All Courses"
        description="Pick a course to see who offers it, what it costs and what it leads to. Not sure where to start? Choose your stage instead."
      >
        <ul className="flex flex-wrap gap-2">
          {LEVEL_HUBS.map((hub) => (
            <li key={hub.slug}>
              <Chip asChild>
                <Link href={`/${hub.slug}`}>{hub.title}</Link>
              </Chip>
            </li>
          ))}
        </ul>
      </PageHeader>

      <div className="container-site py-8 lg:py-12">
        {/* Jump list — 10 streams is a long page on a phone. */}
        <nav aria-label="Streams" className="flex flex-wrap gap-2">
          {grouped.map(({ stream }) => (
            <Chip key={stream.id} asChild>
              <a href={`#${stream.slug}`}>
                <StreamIcon name={stream.icon} className="size-4" />
                {stream.name}
              </a>
            </Chip>
          ))}
        </nav>

        {grouped.map(({ stream, courses: streamCourses }) => (
          <section
            key={stream.id}
            id={stream.slug}
            aria-labelledby={`${stream.slug}-title`}
            className="scroll-mt-24 py-8"
          >
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 id={`${stream.slug}-title`} className="heading-underline text-h2">
                {stream.name}
              </h2>
              <Link
                href={`/streams/${stream.slug}`}
                className="text-sm font-semibold text-brand-blue-400 hover:underline"
              >
                {stream.collegeCount} college{stream.collegeCount === 1 ? "" : "s"} →
              </Link>
            </div>

            <ul className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {streamCourses.map((course) => (
                <li key={course.id}>
                  <CourseCard course={course} />
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </>
  );
}
