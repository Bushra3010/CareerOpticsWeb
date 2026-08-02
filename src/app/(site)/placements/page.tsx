import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

import { Quote } from "lucide-react";

import { InlineLeadCard } from "@/components/forms/inline-lead-card";
import { PageHeader } from "@/components/taxonomy/page-header";
import { Badge } from "@/components/ui/badge";
import { getPlacements } from "@/lib/queries/content";
import { imageSrc, initials } from "@/lib/media";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Placements Given By Us",
  description:
    "Students we counselled, where they studied and where they work now.",
  alternates: { canonical: "/placements" },
};

/** `/placements` — the testimonial showcase (§4). */
export default async function PlacementsPage() {
  const placements = await getPlacements();

  return (
    <>
      <PageHeader
        crumbs={[{ name: "Placements" }]}
        title="Placements Given By Us"
        description="Students we counselled, the course they took and where they work now. Every story here is a student who called us first."
      />

      <div className="container-site py-8 lg:py-12">
        {placements.length === 0 ? (
          <p className="rounded-xl border border-dashed p-6 text-body">
            Student stories will appear here.
          </p>
        ) : (
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {placements.map((item) => {
              const photo = imageSrc(item.photo_url);
              const college = item.colleges;

              return (
                <li key={item.id}>
                  <figure className="card-lift flex h-full flex-col rounded-xl border bg-card p-5">
                    <Quote className="size-6 text-brand-blue-50" aria-hidden />
                    <blockquote className="mt-2 flex-1 text-pretty text-body">
                      {item.quote}
                    </blockquote>

                    <figcaption className="mt-4 flex items-center gap-3 border-t pt-4">
                      <span className="flex size-11 shrink-0 items-center justify-center overflow-hidden rounded-full bg-brand-blue-50">
                        {photo ? (
                          <Image
                            src={photo}
                            alt=""
                            width={44}
                            height={44}
                            className="size-full object-cover"
                          />
                        ) : (
                          <span
                            className="font-display text-sm font-extrabold text-brand-blue"
                            aria-hidden
                          >
                            {initials(item.student_name ?? "")}
                          </span>
                        )}
                      </span>
                      <span className="min-w-0">
                        <span className="block truncate font-semibold text-ink">
                          {item.student_name}
                        </span>
                        <span className="block truncate text-sm text-muted-foreground">
                          {[item.course, item.city].filter(Boolean).join(" · ")}
                        </span>
                      </span>
                    </figcaption>

                    <div className="mt-3 flex flex-wrap items-center gap-1.5">
                      {item.company ? (
                        <Badge variant="secondary" size="sm">
                          {item.company}
                        </Badge>
                      ) : null}
                      {item.package_lpa ? (
                        <Badge variant="success" size="sm">
                          ₹{Number(item.package_lpa).toFixed(1)} LPA
                        </Badge>
                      ) : null}
                    </div>

                    {college?.slug ? (
                      <Link
                        href={`/colleges/${college.slug}`}
                        className="mt-3 truncate text-sm font-semibold text-brand-blue-400 hover:underline focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
                      >
                        {college.name}
                      </Link>
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
