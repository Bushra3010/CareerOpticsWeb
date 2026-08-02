import type { Metadata } from "next";

import { FinderResults, type FinderAnswerParams } from "@/components/finder/finder-results";
import { FinderWizard } from "@/components/finder/finder-wizard";
import { PageHeader } from "@/components/taxonomy/page-header";
import { getFinderOptions } from "@/lib/queries/finder";

/**
 * The result view is generated from a query string, so it is `noindex, follow`
 * (§10) — only the wizard itself is a landing page.
 */
export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<{ matched?: string }>;
}): Promise<Metadata> {
  const { matched } = await searchParams;

  return {
    title: "College Finder — Get a Shortlist in 2 Minutes",
    description:
      "Answer six questions about your marks, stream, budget and city, and get a free shortlist of colleges you can actually get into.",
    alternates: { canonical: "/college-finder" },
    robots: matched === "1" ? { index: false, follow: true } : undefined,
  };
}

/**
 * `/college-finder` — PRD §5.4.
 *
 * One route, two states. Without `?matched=1` it renders the wizard; with it,
 * the server renders the shortlist from the answers in the URL, reusing the
 * §5.2 listing query rather than a second client fetch.
 */
export default async function CollegeFinderPage({
  searchParams,
}: {
  searchParams: Promise<FinderAnswerParams & { matched?: string }>;
}) {
  const params = await searchParams;
  const matched = params.matched === "1";

  // Only fetched for the wizard — the result view does not need the options.
  const options = matched ? null : await getFinderOptions();

  return (
    <>
      <PageHeader
        crumbs={[{ name: "College Finder" }]}
        title={matched ? "Your matched colleges" : "Find your right college"}
        description={
          matched
            ? null
            : "Six quick questions — marks, stream, budget and city. We shortlist what you can actually get into, and a counsellor confirms it. Free."
        }
      />

      <div className="container-site py-8 lg:py-12">
        {matched ? (
          <FinderResults params={params} />
        ) : (
          <FinderWizard options={options!} />
        )}
      </div>
    </>
  );
}
