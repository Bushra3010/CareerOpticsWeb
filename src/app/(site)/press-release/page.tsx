import type { Metadata } from "next";
import Image from "next/image";

import { ExternalLink } from "lucide-react";

import { InlineLeadCard } from "@/components/forms/inline-lead-card";
import { PageHeader } from "@/components/taxonomy/page-header";
import { getPressReleases } from "@/lib/queries/content";
import { imageSrc } from "@/lib/media";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Press Release",
  description:
    "CareerOptics in the press — coverage of our counselling camps and admission drives.",
  alternates: { canonical: "/press-release" },
};

function formatDate(value: string | null) {
  if (!value) return null;
  const date = new Date(`${value}T00:00:00Z`);
  if (Number.isNaN(date.getTime())) return null;
  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(date);
}

/** `/press-release` — §4. */
export default async function PressReleasePage() {
  const items = await getPressReleases();

  return (
    <>
      <PageHeader
        crumbs={[{ name: "Press Release" }]}
        title="Press Release"
        description="Where our counselling camps and admission drives have been covered."
      />

      <div className="container-site py-8 lg:py-12">
        {items.length === 0 ? (
          <p className="rounded-xl border border-dashed p-6 text-body">
            Press coverage will be listed here.
          </p>
        ) : (
          <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((item) => {
              const src = imageSrc(item.image_url);
              const when = formatDate(item.published_on);
              // The article if there is one, otherwise the full-size clipping.
              // §17 forbids dead links, so a card with neither is not a link.
              const href = item.article_url ?? src;
              const Wrapper = href ? "a" : "div";

              return (
                <li key={item.id}>
                  <Wrapper
                    {...(href ? { href, target: "_blank", rel: "noopener noreferrer" } : {})}
                    className="card-lift flex h-full flex-col overflow-hidden rounded-xl border bg-card focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:outline-none"
                  >
                    {src ? (
                      <div className="relative aspect-[4/5] bg-surface">
                        <Image
                          src={src}
                          alt={item.publication ?? "Newspaper clipping"}
                          fill
                          sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                          className="object-contain p-2"
                        />
                      </div>
                    ) : null}
                    <div className="flex flex-1 flex-col gap-1 p-4">
                      <span className="font-display text-base font-bold text-ink">
                        {item.publication}
                      </span>
                      {when ? (
                        <span className="text-sm text-muted-foreground tabular-nums">{when}</span>
                      ) : null}
                      {href ? (
                        <span className="mt-auto inline-flex items-center gap-1 pt-2 text-sm font-semibold text-brand-blue-400">
                          {item.article_url ? "Read article" : "View full clipping"}
                          <ExternalLink className="size-3.5" aria-hidden />
                        </span>
                      ) : null}
                    </div>
                  </Wrapper>
                </li>
              );
            })}
          </ul>
        )}

        <div className="mt-10">
          <InlineLeadCard />
        </div>
      </div>
    </>
  );
}
