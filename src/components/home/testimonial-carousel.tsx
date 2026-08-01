import Image from "next/image";
import Link from "next/link";

import { Quote } from "lucide-react";

import { ScrollRow } from "@/components/home/scroll-row";
import { Badge } from "@/components/ui/badge";
import type { Testimonial } from "@/lib/queries/home";
import { imageSrc, initials } from "@/lib/media";

/** §5.1 item 12 — "Placements Given By Us". */
export function TestimonialCarousel({
  testimonials,
}: {
  testimonials: Testimonial[];
}) {
  return (
    <ScrollRow label="Student placements" className="items-stretch">
      {testimonials.map((item) => {
        const photo = imageSrc(item.photo_url);
        const college = item.colleges;

        return (
          <figure
            key={item.id}
            className="card-lift flex w-[300px] shrink-0 snap-start flex-col rounded-xl border bg-card p-5"
          >
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
                className="mt-3 truncate text-sm font-semibold text-brand-blue-400 hover:underline focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:outline-none"
              >
                {college.name}
              </Link>
            ) : null}
          </figure>
        );
      })}
    </ScrollRow>
  );
}
