import Image from "next/image";
import Link from "next/link";

import { BadgeIndianRupee } from "lucide-react";

import { Button } from "@/components/ui/button";
import type { FeaturedScholarship } from "@/lib/queries/home";
import { imageSrc } from "@/lib/media";

/** First paragraph of the markdown body, used as the teaser. */
function excerpt(content: string | null, limit = 320) {
  if (!content) return null;
  const text = content
    .split("\n")
    .filter((line) => line.trim() && !line.trim().startsWith("#"))
    .join(" ")
    .replace(/[*_`]/g, "")
    .trim();
  return text.length > limit ? `${text.slice(0, limit).trimEnd()}…` : text;
}

/**
 * §5.1 item 11 — two columns, teaser with a Read More toggle. The toggle is a
 * native `<details>`, so the section stays a Server Component and the full text
 * is in the HTML for SEO.
 */
export function ScholarshipSection({
  scholarship,
}: {
  scholarship: NonNullable<FeaturedScholarship>;
}) {
  const image = imageSrc(scholarship.image_url);
  const teaser = excerpt(scholarship.content);
  const href = `/scholarships/${scholarship.slug}`;

  return (
    <div className="grid items-center gap-8 lg:grid-cols-2">
      <div>
        {scholarship.state ? (
          <p className="text-sm font-semibold text-brand-orange">
            {scholarship.state} · Government scheme
          </p>
        ) : null}
        <h3 className="mt-2 text-h3">{scholarship.title}</h3>

        {teaser ? (
          <details className="group mt-3">
            <summary className="cursor-pointer list-none text-body marker:content-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:outline-none">
              <span className="line-clamp-3 group-open:line-clamp-none">
                {teaser}
              </span>
              <span className="mt-2 inline-block font-semibold text-brand-blue-400 group-open:hidden">
                Read More
              </span>
              <span className="mt-2 hidden font-semibold text-brand-blue-400 group-open:inline-block">
                Show Less
              </span>
            </summary>
          </details>
        ) : null}

        <div className="mt-6 flex flex-wrap gap-3">
          <Button asChild>
            <Link href={href}>Check Eligibility</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/contact">Talk to a Counsellor</Link>
          </Button>
        </div>
      </div>

      <div className="relative aspect-[16/10] overflow-hidden rounded-xl bg-brand-blue-50">
        {image ? (
          <Image
            src={image}
            alt={scholarship.title}
            fill
            sizes="(min-width: 1024px) 600px, 100vw"
            className="object-cover"
          />
        ) : (
          <div className="flex h-full flex-col items-center justify-center gap-3 p-6 text-center">
            <BadgeIndianRupee className="size-10 text-brand-blue" aria-hidden />
            <p className="max-w-xs font-display text-h3 text-brand-blue">
              Education loans and state scholarships, explained
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
