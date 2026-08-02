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
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {items.map((item) => {
              const src = imageSrc(item.image_url);
              const when = formatDate(item.published_on);

              // §17 forbids dead links — an item without a URL is a plain card.
              const Wrapper = item.article_url ? "a" : "div";

              return (
                <li key={item.id}>
                  <Wrapper
                    {...(item.article_url
                      ? {
                          href: item.article_url,
                          target: "_blank",
                          rel: "noopener noreferrer",
                        }
                      : {})}
                    className="card-lift flex h-full flex-col items-center gap-2 rounded-xl border bg-card p-6 text-center focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:outline-none"
                  >
                    {src ? (
                      <Image
                        src={src}
                        alt={item.publication ?? "Publication"}
                        width={140}
                        height={48}
                        className="h-12 w-auto object-contain"
                      />
                    ) : (
                      <span className="font-display text-h3 text-brand-blue-900">
                        {item.publication}
                      </span>
                    )}
                    {when ? (
                      <span className="text-sm text-muted-foreground tabular-nums">
                        {when}
                      </span>
                    ) : null}
                    {item.article_url ? (
                      <span className="mt-auto inline-flex items-center gap-1 pt-2 text-sm font-semibold text-brand-blue-400">
                        Read article
                        <ExternalLink className="size-3.5" aria-hidden />
                      </span>
                    ) : null}
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
