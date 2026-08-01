import Image from "next/image";
import Link from "next/link";

import { MapPin } from "lucide-react";

import { LeadDialog } from "@/components/forms/lead-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Rating } from "@/components/ui/rating";
import type { FeaturedCollege } from "@/lib/queries/home";
import { formatInr, imageSrc, initials } from "@/lib/media";
import { cn } from "@/lib/utils";

/**
 * §5.1 item 7 card. Also the card the /colleges listing will reuse in P5, so
 * it takes a college row rather than home-specific props.
 *
 * `Apply Now` is a link to the college page until the lead modal lands in P4 —
 * §17 requires zero dead `#` links.
 */
export function CollegeCard({
  college,
  className,
}: {
  college: FeaturedCollege;
  className?: string;
}) {
  const cover = imageSrc(college.cover_url);
  const logo = imageSrc(college.logo_url);
  const city = college.cities?.name;
  const state = college.cities?.states?.name;
  const location = [city, state].filter(Boolean).join(", ");
  const highest = formatInr(college.highest_package);
  const average = formatInr(college.average_package);
  const approvals = college.approvals ?? [];
  const href = `/colleges/${college.slug}`;

  return (
    <article
      className={cn(
        "card-lift flex h-full flex-col overflow-hidden rounded-xl border bg-card",
        className,
      )}
    >
      <div className="relative h-32 shrink-0 bg-brand-blue-50">
        {cover ? (
          <Image
            src={cover}
            alt=""
            fill
            sizes="(min-width: 1024px) 300px, 80vw"
            className="object-cover"
          />
        ) : (
          // No cover uploaded yet — a typographic plate reads better than an
          // empty tile and disappears the moment a real image lands.
          <span
            className="flex h-full items-center justify-center px-4 text-center font-display text-h3 text-brand-blue/25"
            aria-hidden
          >
            {college.short_name ?? college.name}
          </span>
        )}
        <div className="absolute -bottom-6 left-4 flex size-12 items-center justify-center overflow-hidden rounded-lg border bg-white">
          {logo ? (
            <Image
              src={logo}
              alt=""
              width={48}
              height={48}
              className="size-full object-contain p-1"
            />
          ) : (
            <span
              className="font-display text-sm font-extrabold text-brand-blue"
              aria-hidden
            >
              {initials(college.short_name ?? college.name)}
            </span>
          )}
        </div>
        {college.nirf_rank ? (
          <Badge variant="urgent" size="sm" className="absolute top-3 right-3">
            NIRF #{college.nirf_rank}
          </Badge>
        ) : null}
      </div>

      <div className="flex flex-1 flex-col p-4 pt-8">
        <h3 className="line-clamp-2 text-base font-semibold text-ink">
          <Link href={href} className="hover:text-brand-blue">
            {college.name}
          </Link>
        </h3>

        {location ? (
          <p className="mt-1 flex items-center gap-1 text-sm text-muted-foreground">
            <MapPin className="size-3.5 shrink-0" aria-hidden />
            <span className="truncate">{location}</span>
          </p>
        ) : null}

        <div className="mt-3 flex flex-wrap items-center gap-1.5">
          {college.naac_grade ? (
            <Badge variant="secondary" size="sm">
              NAAC {college.naac_grade}
            </Badge>
          ) : null}
          {approvals.slice(0, 3).map((approval) => (
            <Badge key={approval} variant="outline" size="sm">
              {approval}
            </Badge>
          ))}
        </div>

        {highest || average ? (
          <dl className="mt-3 grid grid-cols-2 gap-2 rounded-lg bg-surface p-2.5">
            {highest ? (
              <div>
                <dt className="text-sm text-muted-foreground">Highest</dt>
                <dd className="font-semibold text-ink tabular-nums">{highest}</dd>
              </div>
            ) : null}
            {average ? (
              <div>
                <dt className="text-sm text-muted-foreground">Average</dt>
                <dd className="font-semibold text-ink tabular-nums">{average}</dd>
              </div>
            ) : null}
          </dl>
        ) : null}

        {college.rating && college.rating > 0 ? (
          <Rating
            value={Number(college.rating)}
            count={college.review_count}
            size="sm"
            className="mt-3"
          />
        ) : null}

        <div className="mt-4 flex gap-2 pt-1">
          <LeadDialog
            source="apply_now"
            collegeId={college.id}
            title={`Apply to ${college.short_name ?? college.name}`}
            description="A counsellor will confirm eligibility, fees and the next admission date."
            fields={["city", "level", "message"]}
            submitLabel="Submit Application"
          >
            <Button size="sm" className="flex-1">
              Apply Now
            </Button>
          </LeadDialog>
          <Button asChild size="sm" variant="outline" className="flex-1">
            <Link href={href}>Know More</Link>
          </Button>
        </div>
      </div>
    </article>
  );
}
