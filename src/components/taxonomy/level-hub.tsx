import type { Metadata } from "next";
import Link from "next/link";

import { InlineLeadCard } from "@/components/forms/inline-lead-card";
import { CourseCard } from "@/components/taxonomy/course-card";
import { PageHeader } from "@/components/taxonomy/page-header";
import { TaxonomySection } from "@/components/taxonomy/section";
import { Chip } from "@/components/ui/chip";
import { siteConfig } from "@/config/site";
import {
  LEVEL_HUBS,
  getCoursesAtLevels,
  getGuidesForLevel,
  type LevelHub,
} from "@/lib/queries/taxonomy";
import { breadcrumbSchema, JsonLd } from "@/lib/seo/json-ld";

/**
 * The four level hubs (§4) differ only by which `level_enum` values they cover,
 * so they share this component and each route file is a three-line wrapper.
 */
export function levelHubMetadata(hub: LevelHub): Metadata {
  const title = `${hub.title} — Eligibility, Fees, Colleges | ${siteConfig.name}`;
  return {
    title: { absolute: title },
    description: hub.description,
    alternates: { canonical: `/${hub.slug}` },
    openGraph: { title, description: hub.description, type: "website" },
  };
}

export async function LevelHubPage({ hub }: { hub: LevelHub }) {
  const [courses, guides] = await Promise.all([
    getCoursesAtLevels(hub.levels),
    // One guide list per hub; `guides` is empty until an editor adds content.
    Promise.all(hub.levels.map((level) => getGuidesForLevel(level))).then((lists) =>
      lists.flat(),
    ),
  ]);

  // Group by stream so a long list reads as choices, not an alphabet soup.
  const byStream = new Map<
    string,
    { name: string; slug: string; courses: typeof courses }
  >();
  for (const course of courses) {
    const stream = course.streams;
    if (!stream) continue;
    const entry = byStream.get(stream.slug) ?? {
      name: stream.name,
      slug: stream.slug,
      courses: [],
    };
    entry.courses.push(course);
    byStream.set(stream.slug, entry);
  }
  const groups = [...byStream.values()].sort((a, b) =>
    a.name.localeCompare(b.name),
  );

  return (
    <>
      <PageHeader
        crumbs={[{ name: "Courses", href: "/courses" }, { name: hub.title }]}
        title={hub.title}
        description={hub.description}
      >
        <ul className="flex flex-wrap gap-2">
          {LEVEL_HUBS.filter((other) => other.slug !== hub.slug).map((other) => (
            <li key={other.slug}>
              <Chip asChild>
                <Link href={`/${other.slug}`}>{other.title}</Link>
              </Chip>
            </li>
          ))}
        </ul>
      </PageHeader>

      <div className="container-site py-8 lg:py-12">
        {groups.length === 0 ? (
          <>
            <p className="mb-6 rounded-xl border border-dashed p-6 text-body">
              We are still mapping courses for this stage. A counsellor can walk
              you through the options in a five-minute call.
            </p>
            <InlineLeadCard />
          </>
        ) : (
          groups.map((group) => (
            <TaxonomySection key={group.slug} title={group.name}>
              <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {group.courses.map((course) => (
                  <li key={course.id}>
                    <CourseCard course={course} />
                  </li>
                ))}
              </ul>
              <div className="mt-4">
                <Link
                  href={`/streams/${group.slug}`}
                  className="text-sm font-semibold text-brand-blue-400 hover:underline"
                >
                  All {group.name.toLowerCase()} courses and colleges →
                </Link>
              </div>
            </TaxonomySection>
          ))
        )}

        {guides.length > 0 ? (
          <TaxonomySection title="Guides">
            <ul className="grid gap-3 sm:grid-cols-2">
              {guides.map((guide) => (
                <li key={guide.id}>
                  <Link
                    href={`/guides/${guide.level}/${guide.slug}`}
                    className="card-lift block rounded-xl border p-4 font-medium text-ink hover:text-brand-blue"
                  >
                    {guide.title}
                  </Link>
                </li>
              ))}
            </ul>
          </TaxonomySection>
        ) : null}

        <div className="pt-4">
          <InlineLeadCard />
        </div>
      </div>

      <JsonLd
        data={breadcrumbSchema(
          [
            { name: "Home", path: "/" },
            { name: "Courses", path: "/courses" },
            { name: hub.title, path: `/${hub.slug}` },
          ],
          siteConfig.url,
        )}
      />
    </>
  );
}
