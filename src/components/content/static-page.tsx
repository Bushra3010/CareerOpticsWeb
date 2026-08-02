import type { Metadata } from "next";

import { AlertTriangle } from "lucide-react";

import { Prose } from "@/components/content/prose";
import { InlineLeadCard } from "@/components/forms/inline-lead-card";
import { PageHeader } from "@/components/taxonomy/page-header";
import { LEGAL_REVIEW_NOTICE, type StaticPage } from "@/config/legal";

export function staticPageMetadata(page: StaticPage): Metadata {
  return {
    title: page.title,
    description: page.description,
    alternates: { canonical: `/${page.slug}` },
  };
}

/**
 * Renders one of the §4 static pages from `config/legal.ts`.
 *
 * Pages marked `draft` carry a visible banner. A privacy policy or terms page
 * that has not been through legal review should say so to the reader, not just
 * in a code comment — the alternative is presenting an unreviewed document as
 * if it were binding.
 */
export function StaticPageBody({ page }: { page: StaticPage }) {
  return (
    <>
      <PageHeader
        crumbs={[{ name: page.title }]}
        title={page.title}
        description={page.description}
      />

      <div className="container-site py-8 lg:py-12">
        {page.draft ? (
          <p className="mb-8 flex max-w-3xl items-start gap-2 rounded-lg border border-brand-orange/30 bg-brand-orange/10 p-4 text-sm text-ink">
            <AlertTriangle className="mt-0.5 size-4 shrink-0" aria-hidden />
            <span>{LEGAL_REVIEW_NOTICE}</span>
          </p>
        ) : null}

        <Prose content={page.body} />

        <div className="mt-10 max-w-3xl">
          <InlineLeadCard />
        </div>
      </div>
    </>
  );
}
