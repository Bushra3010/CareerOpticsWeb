import type { Metadata } from "next";
import Link from "next/link";

import { BadgeIndianRupee, ArrowRight } from "lucide-react";

import { InlineLeadCard } from "@/components/forms/inline-lead-card";
import { PageHeader } from "@/components/taxonomy/page-header";
import { Badge } from "@/components/ui/badge";
import { listScholarships } from "@/lib/queries/content";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Scholarships & Education Loans",
  description:
    "Government schemes, state scholarships and education loans Indian students can use — eligibility, documents and how to apply.",
  alternates: { canonical: "/scholarships" },
};

/** First non-heading sentence of the body, used as the card teaser. */
function excerpt(content: string | null, limit = 200) {
  if (!content) return null;
  const text = content
    .split("\n")
    .filter((line) => line.trim() && !line.trim().startsWith("#"))
    .join(" ")
    .replace(/[*_`]/g, "")
    .trim();
  return text.length > limit ? `${text.slice(0, limit).trimEnd()}…` : text;
}

/** `/scholarships` — §4. */
export default async function ScholarshipsPage() {
  const scholarships = await listScholarships();

  return (
    <>
      <PageHeader
        crumbs={[{ name: "Scholarships" }]}
        title="Scholarships & Education Loans"
        description="Money should not decide where you study. These are the schemes we help students apply for — free."
      />

      <div className="container-site py-8 lg:py-12">
        {scholarships.length === 0 ? (
          <p className="rounded-xl border border-dashed p-6 text-body">
            Scheme guides are on the way. Ask a counsellor which one you qualify for.
          </p>
        ) : (
          <ul className="grid gap-4 sm:grid-cols-2">
            {scholarships.map((scholarship) => (
              <li key={scholarship.id}>
                <article className="card-lift relative flex h-full flex-col rounded-xl border bg-card p-6">
                  <span className="flex size-11 items-center justify-center rounded-full bg-brand-blue-50 text-brand-blue">
                    <BadgeIndianRupee className="size-5" aria-hidden />
                  </span>

                  {scholarship.state ? (
                    <Badge variant="secondary" size="sm" className="mt-4 w-fit">
                      {scholarship.state}
                    </Badge>
                  ) : null}

                  <h2 className="mt-2 text-h3">
                    <Link
                      href={`/scholarships/${scholarship.slug}`}
                      className="after:absolute after:inset-0 hover:text-brand-blue focus-visible:outline-none"
                    >
                      {scholarship.title}
                    </Link>
                  </h2>

                  {excerpt(scholarship.content) ? (
                    <p className="mt-2 line-clamp-3 text-sm text-body">
                      {excerpt(scholarship.content)}
                    </p>
                  ) : null}

                  <span className="mt-auto inline-flex items-center gap-1 pt-4 text-sm font-semibold text-brand-blue-400">
                    Eligibility and how to apply
                    <ArrowRight className="size-4" aria-hidden />
                  </span>
                </article>
              </li>
            ))}
          </ul>
        )}

        <div className="mt-10">
          <InlineLeadCard />
        </div>
      </div>
    </>
  );
}
