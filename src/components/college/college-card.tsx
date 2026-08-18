import Image from "next/image";
import Link from "next/link";

import { MapPin } from "lucide-react";

import { CoverPlate } from "@/components/college/cover-plate";
import { LeadDialog } from "@/components/forms/lead-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Rating } from "@/components/ui/rating";
import { formatInr, imageSrc, initials } from "@/lib/media";
import { cn } from "@/lib/utils";

/**
 * Structural shape rather than one query's row type — the home carousel, the
 * stream hubs, the city pages and the course pages all feed this card, and
 * they select the same columns.
 */
export type CollegeCardData = {
  id: string;
  name: string;
  slug: string;
  short_name: string | null;
  naac_grade: string | null;
  nirf_rank: number | null;
  approvals: string[] | null;
  logo_url: string | null;
  cover_url: string | null;
  highest_package: number | null;
  average_package: number | null;
  rating: number | null;
  review_count: number | null;
  cities?: { name: string; slug?: string; states?: { name: string } | null } | null;
};

/**
 * Compact college card — the home "Top Universities" carousel (§5.1 item 7)
 * and every taxonomy grid (stream, course, city, exam).
 *
 * `/colleges` uses the wider `CollegeListCard` instead, which adds the compare
 * checkbox and the fee row. This one has no compare affordance, so it is safe
 * outside the `CompareProvider` that only wraps the `/colleges` subtree.
 */
export function CollegeCard({
  college,
  className,
}: {
  college: CollegeCardData;
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
            // Campus photos put the building in the lower half; a centred crop
            // in a 128px-tall tile shows mostly sky.
            className="object-cover object-[50%_70%]"
          />
        ) : (
          <CoverPlate name={college.short_name ?? college.name} seed={college.slug} />
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
            {college.cities?.slug ? (
              <Link
                href={`/city/${college.cities.slug}`}
                className="relative z-10 truncate hover:text-brand-blue-400 hover:underline"
              >
                {location}
              </Link>
            ) : (
              <span className="truncate">{location}</span>
            )}
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
            fields={["email", "city", "level", "admission", "message"]}
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
