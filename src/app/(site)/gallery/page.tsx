import type { Metadata } from "next";

import { ImageIcon } from "lucide-react";

import { InlineLeadCard } from "@/components/forms/inline-lead-card";
import { PageHeader } from "@/components/taxonomy/page-header";
import { getGallery } from "@/lib/queries/content";
import { imageSrc } from "@/lib/media";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Gallery",
  description:
    "Counselling camps, campus visits, admission help desks and student felicitations across Bihar.",
  alternates: { canonical: "/gallery" },
};

function formatEventDate(value: string | null) {
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

/** `/gallery` — §4. */
export default async function GalleryPage() {
  const items = await getGallery();

  return (
    <>
      <PageHeader
        crumbs={[{ name: "Gallery" }]}
        title="Gallery"
        description="Counselling camps, campus visits and admission help desks — what the work actually looks like."
      />

      <div className="container-site py-8 lg:py-12">
        {items.length === 0 ? (
          <p className="rounded-xl border border-dashed p-6 text-body">
            Photos from our camps and campus visits will appear here.
          </p>
        ) : (
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((item) => {
              const src = imageSrc(item.image_url);
              const when = formatEventDate(item.event_date);

              return (
                <li key={item.id}>
                  <figure className="card-lift overflow-hidden rounded-xl border bg-card">
                    <div className="relative aspect-[4/3] bg-brand-blue-50">
                      {src ? (
                        // eslint-disable-next-line @next/next/no-img-element -- gallery URLs are arbitrary storage hosts until next.config remotePatterns is set in P11
                        <img
                          src={src}
                          alt={item.caption ?? ""}
                          loading="lazy"
                          className="size-full object-cover"
                        />
                      ) : (
                        <span className="flex h-full items-center justify-center">
                          <ImageIcon className="size-7 text-brand-blue/40" aria-hidden />
                        </span>
                      )}
                    </div>
                    {item.caption ? (
                      <figcaption className="p-4">
                        <p className="font-medium text-ink">{item.caption}</p>
                        {when ? (
                          <p className="mt-0.5 text-sm text-muted-foreground tabular-nums">
                            {when}
                          </p>
                        ) : null}
                      </figcaption>
                    ) : null}
                  </figure>
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
