import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { PageHeader } from "@/components/taxonomy/page-header";
import { InlineLeadCard } from "@/components/forms/inline-lead-card";
import { siteConfig } from "@/config/site";
import { LEVEL_LABELS, getGuide } from "@/lib/queries/taxonomy";
import { breadcrumbSchema, JsonLd } from "@/lib/seo/json-ld";

export const revalidate = 3600;

/**
 * `/guides/[level]/[slug]` — §4 career and course guides.
 *
 * No `generateStaticParams`: the `guides` table is empty until an editor writes
 * one in P10, so every request renders on demand and is then cached by ISR.
 * Prerendering an empty list would just be an empty build step.
 */
export async function generateMetadata({
  params,
}: {
  params: Promise<{ level: string; slug: string }>;
}): Promise<Metadata> {
  const { level, slug } = await params;
  const guide = await getGuide(level, slug);
  if (!guide) return { title: "Guide not found" };

  const title = guide.meta_title ?? `${guide.title} | ${siteConfig.name}`;
  const description =
    guide.meta_description ??
    `${guide.title} — a ${siteConfig.name} guide for students ${LEVEL_LABELS[level]?.toLowerCase() ?? level}.`;

  return {
    title: { absolute: title },
    description,
    alternates: { canonical: `/guides/${guide.level}/${guide.slug}` },
    openGraph: { title, description, type: "article" },
  };
}

export default async function GuidePage({
  params,
}: {
  params: Promise<{ level: string; slug: string }>;
}) {
  const { level, slug } = await params;
  const guide = await getGuide(level, slug);
  if (!guide) notFound();

  return (
    <>
      <PageHeader
        crumbs={[
          { name: "Guides", href: "/courses" },
          { name: LEVEL_LABELS[guide.level ?? ""] ?? "Guide" },
          { name: guide.title ?? "Guide" },
        ]}
        title={guide.title ?? "Guide"}
      />

      <div className="container-site py-8 lg:py-12">
        <article className="max-w-3xl">
          {/* Guide bodies are plain text/markdown from the editor. Rendering
              them as text keeps injected markup out of the page; a markdown
              renderer arrives with the blog in P9. */}
          {(guide.content ?? "")
            .split(/\n{2,}/)
            .filter((block) => block.trim())
            .map((block, index) => (
              <p key={index} className="mt-4 text-pretty text-body first:mt-0">
                {block.trim()}
              </p>
            ))}
        </article>

        <div className="mt-10 max-w-3xl">
          <InlineLeadCard />
        </div>
      </div>

      <JsonLd
        data={breadcrumbSchema(
          [
            { name: "Home", path: "/" },
            { name: "Courses", path: "/courses" },
            { name: guide.title ?? "Guide", path: `/guides/${guide.level}/${guide.slug}` },
          ],
          siteConfig.url,
        )}
      />
    </>
  );
}
