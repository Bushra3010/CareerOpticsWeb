import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { CollegeGrid } from "@/components/taxonomy/college-grid";
import { PageHeader } from "@/components/taxonomy/page-header";
import { TaxonomySection } from "@/components/taxonomy/section";
import { siteConfig } from "@/config/site";
import {
  getCitySlugsWithColleges,
  getCityBySlug,
  getCollegesInCity,
} from "@/lib/queries/taxonomy";
import { breadcrumbSchema, JsonLd } from "@/lib/seo/json-ld";

export const revalidate = 3600;

/**
 * Only cities that actually have a published college are prerendered — there
 * are 120 seeded cities and most have none, so building all of them would ship
 * empty pages for search engines to index.
 */
export async function generateStaticParams() {
  const slugs = await getCitySlugsWithColleges();
  return slugs.map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const city = await getCityBySlug(slug);
  if (!city) return { title: "City not found" };

  const state = city.states?.name;
  const title = `Colleges in ${city.name}${state ? `, ${state}` : ""} 2026 | ${siteConfig.name}`;
  const description = `Colleges and universities in ${city.name}: courses, fees, NAAC grade and placements. Free admission counselling from ${siteConfig.name}.`;

  return {
    title: { absolute: title },
    description,
    alternates: { canonical: `/city/${city.slug}` },
    openGraph: { title, description, type: "website" },
  };
}

/** `/city/[slug]` — colleges in a city (§4). */
export default async function CityPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const city = await getCityBySlug(slug);
  if (!city) notFound();

  const colleges = await getCollegesInCity(city.id);
  const state = city.states?.name;

  return (
    <>
      <PageHeader
        crumbs={[
          { name: "Colleges", href: "/colleges" },
          { name: city.name },
        ]}
        title={`Colleges in ${city.name}`}
        description={`${colleges.length} college${colleges.length === 1 ? "" : "s"} in ${city.name}${state ? `, ${state}` : ""} — with courses, fees and placement figures.`}
      />

      <div className="container-site py-8 lg:py-12">
        <TaxonomySection title={`Colleges in ${city.name}`}>
          <CollegeGrid
            colleges={colleges}
            emptyMessage={`We do not list a college in ${city.name} yet. Tell a counsellor what you are looking for and we will find one nearby.`}
            moreHref={`/colleges?city=${city.slug}`}
            moreLabel="Filter all colleges by this city"
          />
        </TaxonomySection>
      </div>

      <JsonLd
        data={breadcrumbSchema(
          [
            { name: "Home", path: "/" },
            { name: "Colleges", path: "/colleges" },
            { name: city.name, path: `/city/${city.slug}` },
          ],
          siteConfig.url,
        )}
      />
    </>
  );
}
