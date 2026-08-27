import type { Metadata } from "next";
import Image from "next/image";

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

        {/* Floated so the copy wraps beside it on desktop rather than being
            pushed a full portrait-height down the page; full width and stacked
            on phones, where a 16rem float would leave unreadable line lengths. */}
        {page.image ? (
          <figure className="mb-6 sm:float-right sm:mb-4 sm:ml-8 sm:w-64">
            <Image
              src={page.image.src}
              alt={page.image.alt}
              width={512}
              height={512}
              sizes="(min-width: 640px) 16rem, 100vw"
              className="w-full rounded-xl border object-cover shadow-card"
            />
            {page.image.caption ? (
              <figcaption className="mt-2 text-sm text-muted-foreground">
                {page.image.caption}
              </figcaption>
            ) : null}
          </figure>
        ) : null}

        <Prose content={page.body} />

        {/* clear-both so the lead card starts below the float, never beside it. */}
        <div className="mt-10 max-w-3xl clear-both">
          <InlineLeadCard />
        </div>
      </div>
    </>
  );
}
