import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { LeadDialog } from "@/components/forms/lead-dialog";
import { CollegeGrid } from "@/components/taxonomy/college-grid";
import { formatDuration, formatFeeRange } from "@/components/taxonomy/course-card";
import { PageHeader } from "@/components/taxonomy/page-header";
import { TaxonomySection } from "@/components/taxonomy/section";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { siteConfig } from "@/config/site";
import {
  LEVEL_LABELS,
  getCollegesOfferingCourse,
  getCourseBySlug,
  getCourseSlugs,
} from "@/lib/queries/taxonomy";
import { breadcrumbSchema, JsonLd } from "@/lib/seo/json-ld";

export const revalidate = 3600;

export async function generateStaticParams() {
  const slugs = await getCourseSlugs();
  return slugs.map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const course = await getCourseBySlug(slug);
  if (!course) return { title: "Course not found" };

  const title =
    course.meta_title ??
    `${course.name} - Eligibility, Fees, Colleges 2026 | ${siteConfig.name}`;
  const description =
    course.meta_description ??
    `${course.name}: eligibility, duration, fee range, career scope and the colleges in India that offer it. Free admission counselling from ${siteConfig.name}.`;

  return {
    title: { absolute: title },
    description,
    alternates: { canonical: `/courses/${course.slug}` },
    openGraph: { title, description, type: "website" },
  };
}

/** `/courses/[slug]` — eligibility, fee range, career, top colleges (§4). */
export default async function CourseDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const course = await getCourseBySlug(slug);
  if (!course) notFound();

  const colleges = await getCollegesOfferingCourse(course.id);
  const duration = formatDuration(course.duration_months);
  const fees = formatFeeRange(course.avg_fee_min, course.avg_fee_max);
  const stream = course.streams;

  return (
    <>
      <PageHeader
        crumbs={[
          { name: "Courses", href: "/courses" },
          { name: course.short_name ?? course.name },
        ]}
        title={course.name}
        description={course.description}
      >
        <div className="flex flex-wrap items-center gap-2">
          {course.level ? (
            <Badge variant="secondary">
              {LEVEL_LABELS[course.level] ?? course.level}
            </Badge>
          ) : null}
          {duration ? <Badge variant="outline">{duration}</Badge> : null}
          {fees ? <Badge variant="outline">{fees} per year</Badge> : null}
          {stream ? (
            <Link
              href={`/streams/${stream.slug}`}
              className="text-sm font-semibold text-brand-blue-400 hover:underline"
            >
              {stream.name} stream →
            </Link>
          ) : null}
        </div>
      </PageHeader>

      <div className="container-site py-8 lg:py-12">
        {course.eligibility ? (
          <TaxonomySection title="Eligibility">
            <p className="text-pretty text-body">{course.eligibility}</p>
          </TaxonomySection>
        ) : null}

        {fees ? (
          <TaxonomySection title="Fees">
            <p className="text-body">
              Typical fees run{" "}
              <strong className="text-ink tabular-nums">{fees}</strong> per year
              across the colleges we cover. Government and state institutions sit
              at the lower end; private and deemed universities at the upper.
            </p>
          </TaxonomySection>
        ) : null}

        {course.career_scope ? (
          <TaxonomySection title="Career scope">
            <p className="text-pretty text-body">{course.career_scope}</p>
          </TaxonomySection>
        ) : null}

        <TaxonomySection
          title={`Colleges offering ${course.short_name ?? course.name}`}
          description="Ordered by fee, lowest first."
        >
          <CollegeGrid
            colleges={colleges}
            emptyMessage={`No college in our list is mapped to ${course.name} yet. A counsellor can still shortlist one for you.`}
            moreHref={`/colleges?course=${course.slug}`}
            moreLabel="Filter all colleges by this course"
          />
        </TaxonomySection>

        <div className="rounded-xl bg-brand-blue-50 p-6">
          <h2 className="text-h3">Not sure if {course.short_name ?? course.name} fits?</h2>
          <p className="mt-1 text-body">
            Tell us your marks and budget. A counsellor will tell you honestly
            whether this course is the right route — free.
          </p>
          <LeadDialog
            source="college_detail"
            courseId={course.id}
            title={`Ask about ${course.short_name ?? course.name}`}
            description="A counsellor will call you with eligibility, fees and college options."
            fields={["city", "level", "message"]}
          >
            <Button className="mt-4">Get Free Counselling</Button>
          </LeadDialog>
        </div>
      </div>

      {/* §10 — Course schema. `provider` is us, the counselling service. */}
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "Course",
          name: course.name,
          description: course.description ?? course.career_scope ?? course.name,
          url: new URL(`/courses/${course.slug}`, siteConfig.url).toString(),
          provider: {
            "@type": "Organization",
            name: siteConfig.legalName,
            url: siteConfig.url,
          },
          ...(course.eligibility
            ? { coursePrerequisites: course.eligibility }
            : {}),
        }}
      />
      <JsonLd
        data={breadcrumbSchema(
          [
            { name: "Home", path: "/" },
            { name: "Courses", path: "/courses" },
            { name: course.name, path: `/courses/${course.slug}` },
          ],
          siteConfig.url,
        )}
      />
    </>
  );
}
