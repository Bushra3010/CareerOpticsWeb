import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { StreamIcon } from "@/components/home/stream-icon";
import { CollegeGrid } from "@/components/taxonomy/college-grid";
import { CourseCard } from "@/components/taxonomy/course-card";
import { PageHeader } from "@/components/taxonomy/page-header";
import { TaxonomySection } from "@/components/taxonomy/section";
import { siteConfig } from "@/config/site";
import {
  getCollegesInStream,
  getCoursesInStream,
  getStreamBySlug,
  getStreamSlugs,
} from "@/lib/queries/taxonomy";
import { breadcrumbSchema, JsonLd } from "@/lib/seo/json-ld";

export const revalidate = 3600;

export async function generateStaticParams() {
  const slugs = await getStreamSlugs();
  return slugs.map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const stream = await getStreamBySlug(slug);
  if (!stream) return { title: "Stream not found" };

  const title = `${stream.name} Courses & Colleges 2026 | ${siteConfig.name}`;
  const description =
    stream.description ??
    `${stream.name} courses in India: eligibility, fees and the colleges that offer them.`;

  return {
    title: { absolute: title },
    description,
    alternates: { canonical: `/streams/${stream.slug}` },
    openGraph: { title, description, type: "website" },
  };
}

/** `/streams/[slug]` — stream hub (§4). */
export default async function StreamPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const stream = await getStreamBySlug(slug);
  if (!stream) notFound();

  const [courses, colleges] = await Promise.all([
    getCoursesInStream(stream.id),
    getCollegesInStream(stream.id),
  ]);

  return (
    <>
      <PageHeader
        crumbs={[{ name: "Courses", href: "/courses" }, { name: stream.name }]}
        title={`${stream.name} Courses & Colleges`}
        description={stream.description}
      >
        <span className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1.5 text-sm font-medium text-brand-blue">
          <StreamIcon name={stream.icon} className="size-4" />
          {courses.length} course{courses.length === 1 ? "" : "s"} ·{" "}
          {colleges.length} college{colleges.length === 1 ? "" : "s"}
        </span>
      </PageHeader>

      <div className="container-site py-8 lg:py-12">
        <TaxonomySection title={`${stream.name} courses`}>
          {courses.length > 0 ? (
            <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {courses.map((course) => (
                <li key={course.id}>
                  <CourseCard course={course} />
                </li>
              ))}
            </ul>
          ) : (
            <p className="rounded-xl border border-dashed p-6 text-body">
              We are still mapping {stream.name} courses. Ask a counsellor and we
              will send you the options directly.
            </p>
          )}
        </TaxonomySection>

        <TaxonomySection
          title={`Top ${stream.name.toLowerCase()} colleges`}
          description="Best rated first."
        >
          <CollegeGrid
            colleges={colleges}
            emptyMessage={`No college in our list offers a ${stream.name.toLowerCase()} course yet.`}
            moreHref={`/colleges?stream=${stream.slug}`}
            moreLabel={`Filter all colleges by ${stream.name.toLowerCase()}`}
          />
        </TaxonomySection>
      </div>

      <JsonLd
        data={breadcrumbSchema(
          [
            { name: "Home", path: "/" },
            { name: "Courses", path: "/courses" },
            { name: stream.name, path: `/streams/${stream.slug}` },
          ],
          siteConfig.url,
        )}
      />
    </>
  );
}
