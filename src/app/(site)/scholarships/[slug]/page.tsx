import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { Prose } from "@/components/content/prose";
import { InlineLeadCard } from "@/components/forms/inline-lead-card";
import { PageHeader } from "@/components/taxonomy/page-header";
import { Badge } from "@/components/ui/badge";
import { siteConfig } from "@/config/site";
import { getScholarship, getScholarshipSlugs } from "@/lib/queries/content";
import { breadcrumbSchema, JsonLd } from "@/lib/seo/json-ld";

export const revalidate = 3600;

export async function generateStaticParams() {
  const slugs = await getScholarshipSlugs();
  return slugs.map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const scholarship = await getScholarship(slug);
  if (!scholarship) return { title: "Scheme not found" };

  const title = scholarship.meta_title ?? `${scholarship.title} | ${siteConfig.name}`;
  const description =
    scholarship.meta_description ??
    `${scholarship.title} — eligibility, documents and how to apply.`;

  return {
    title: { absolute: title },
    description,
    alternates: { canonical: `/scholarships/${scholarship.slug}` },
    openGraph: { title, description, type: "article" },
  };
}

/** `/scholarships/[slug]` — §4. */
export default async function ScholarshipPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const scholarship = await getScholarship(slug);
  if (!scholarship) notFound();

  return (
    <>
      <PageHeader
        crumbs={[
          { name: "Scholarships", href: "/scholarships" },
          { name: scholarship.title ?? "Scheme" },
        ]}
        title={scholarship.title ?? "Scheme"}
      >
        {scholarship.state ? (
          <Badge variant="secondary">{scholarship.state} · Government scheme</Badge>
        ) : null}
      </PageHeader>

      <div className="container-site py-8 lg:py-12">
        <Prose content={scholarship.content} />

        <div className="mt-10 max-w-3xl">
          <InlineLeadCard />
        </div>
      </div>

      <JsonLd
        data={breadcrumbSchema(
          [
            { name: "Home", path: "/" },
            { name: "Scholarships", path: "/scholarships" },
            {
              name: scholarship.title ?? "Scheme",
              path: `/scholarships/${scholarship.slug}`,
            },
          ],
          siteConfig.url,
        )}
      />
    </>
  );
}
