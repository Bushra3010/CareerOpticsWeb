import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { CalendarDays, ExternalLink } from "lucide-react";

import { CollegeGrid } from "@/components/taxonomy/college-grid";
import { PageHeader } from "@/components/taxonomy/page-header";
import { TaxonomySection } from "@/components/taxonomy/section";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Chip } from "@/components/ui/chip";
import { siteConfig } from "@/config/site";
import {
  LEVEL_LABELS,
  getCollegesAcceptingExam,
  getExamBySlug,
  getExamCourses,
  getExamSlugs,
} from "@/lib/queries/taxonomy";
import { breadcrumbSchema, JsonLd } from "@/lib/seo/json-ld";

export const revalidate = 3600;

export async function generateStaticParams() {
  const slugs = await getExamSlugs();
  return slugs.map((slug) => ({ slug }));
}

function formatDate(value: string | null) {
  if (!value) return null;
  const date = new Date(`${value}T00:00:00Z`);
  if (Number.isNaN(date.getTime())) return null;
  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(date);
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const exam = await getExamBySlug(slug);
  if (!exam) return { title: "Exam not found" };

  const title =
    exam.meta_title ??
    `${exam.name} 2027 - Dates, Eligibility, Pattern | ${siteConfig.name}`;
  const description =
    exam.meta_description ??
    `${exam.name} exam date, application window, eligibility, pattern and the colleges that accept the score. Free counselling from ${siteConfig.name}.`;

  return {
    title: { absolute: title },
    description,
    alternates: { canonical: `/exams/${exam.slug}` },
    openGraph: { title, description, type: "website" },
  };
}

/** `/exams/[slug]` — dates, pattern, eligibility, accepting colleges (§4). */
export default async function ExamDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const exam = await getExamBySlug(slug);
  if (!exam) notFound();

  const courses = await getExamCourses(exam.id);
  const colleges = await getCollegesAcceptingExam(courses.map((c) => c.id));

  const dates = [
    { label: "Application opens", value: formatDate(exam.application_start) },
    { label: "Application closes", value: formatDate(exam.application_end) },
    { label: "Exam date", value: formatDate(exam.exam_date) },
  ].filter((row) => row.value);

  return (
    <>
      <PageHeader
        crumbs={[{ name: "Exams", href: "/exams" }, { name: exam.name }]}
        title={exam.name}
        description={exam.conducting_body ? `Conducted by ${exam.conducting_body}.` : null}
      >
        <div className="flex flex-wrap items-center gap-2">
          {exam.level ? (
            <Badge variant="secondary">
              {LEVEL_LABELS[exam.level] ?? exam.level}
            </Badge>
          ) : null}
          {exam.mode ? <Badge variant="outline">{exam.mode}</Badge> : null}
          {exam.official_url ? (
            <Button asChild variant="link" size="sm">
              <a
                href={exam.official_url}
                target="_blank"
                rel="noopener noreferrer nofollow"
              >
                Official website
                <ExternalLink className="size-3.5" />
              </a>
            </Button>
          ) : null}
        </div>
      </PageHeader>

      <div className="container-site py-8 lg:py-12">
        {dates.length > 0 ? (
          <TaxonomySection title="Important dates">
            <dl className="grid gap-4 sm:grid-cols-3">
              {dates.map((row) => (
                <div key={row.label} className="rounded-xl border p-4">
                  <dt className="flex items-center gap-1.5 text-sm text-muted-foreground">
                    <CalendarDays className="size-3.5 text-brand-blue-400" aria-hidden />
                    {row.label}
                  </dt>
                  <dd className="mt-1 font-semibold text-ink tabular-nums">
                    {row.value}
                  </dd>
                </div>
              ))}
            </dl>
          </TaxonomySection>
        ) : null}

        {exam.eligibility ? (
          <TaxonomySection title="Eligibility">
            <p className="text-pretty text-body">{exam.eligibility}</p>
          </TaxonomySection>
        ) : null}

        {exam.pattern ? (
          <TaxonomySection title="Exam pattern">
            <p className="text-pretty text-body">{exam.pattern}</p>
          </TaxonomySection>
        ) : null}

        {exam.syllabus ? (
          <TaxonomySection title="Syllabus">
            <p className="text-pretty text-body">{exam.syllabus}</p>
          </TaxonomySection>
        ) : null}

        {courses.length > 0 ? (
          <TaxonomySection
            title="Courses this exam leads to"
            description={`A ${exam.name} score is used for admission to these programmes.`}
          >
            <ul className="flex flex-wrap gap-2">
              {courses.map((course) => (
                <li key={course.id}>
                  <Chip asChild>
                    <Link href={`/courses/${course.slug}`}>
                      {course.short_name ?? course.name}
                    </Link>
                  </Chip>
                </li>
              ))}
            </ul>
          </TaxonomySection>
        ) : null}

        <TaxonomySection title={`Colleges accepting ${exam.name}`}>
          <CollegeGrid
            colleges={colleges}
            emptyMessage={`We have not mapped a college to ${exam.name} yet. A counsellor can tell you which ones accept it.`}
            moreHref="/colleges"
          />
        </TaxonomySection>
      </div>

      <JsonLd
        data={breadcrumbSchema(
          [
            { name: "Home", path: "/" },
            { name: "Exams", path: "/exams" },
            { name: exam.name, path: `/exams/${exam.slug}` },
          ],
          siteConfig.url,
        )}
      />
    </>
  );
}
