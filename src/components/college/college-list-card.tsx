import Image from "next/image";
import Link from "next/link";

import { Download, MapPin } from "lucide-react";

import { CompareToggle } from "@/components/college/compare-toggle";
import { LeadDialog } from "@/components/forms/lead-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Rating } from "@/components/ui/rating";
import type { CollegeListItem } from "@/lib/queries/colleges";
import { formatInr, imageSrc, initials } from "@/lib/media";

/**
 * §5.2 listing row: logo, name, city, NAAC badge, fee/yr, rating, Compare,
 * Apply Now, Brochure. Wider than the home carousel card, so it is its own
 * component rather than a variant of `CollegeCard`.
 */
export function CollegeListCard({ college }: { college: CollegeListItem }) {
  const logo = imageSrc(college.logo_url);
  const location = [college.cities?.name, college.cities?.states?.name]
    .filter(Boolean)
    .join(", ");
  const fee = formatInr(college.minFee);
  const href = `/colleges/${college.slug}`;
  const approvals = college.approvals ?? [];

  return (
    <article className="card-lift rounded-xl border bg-card p-4 sm:p-5">
      <div className="flex gap-4">
        <div className="flex size-14 shrink-0 items-center justify-center overflow-hidden rounded-lg border bg-white">
          {logo ? (
            <Image
              src={logo}
              alt=""
              width={56}
              height={56}
              className="size-full object-contain p-1"
            />
          ) : (
            <span
              className="font-display text-base font-extrabold text-brand-blue"
              aria-hidden
            >
              {initials(college.short_name ?? college.name)}
            </span>
          )}
        </div>

        <div className="min-w-0 flex-1">
          <h3 className="text-h3">
            <Link href={href} className="hover:text-brand-blue">
              {college.name}
            </Link>
          </h3>

          <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
            {location ? (
              <span className="flex items-center gap-1">
                <MapPin className="size-3.5 shrink-0" aria-hidden />
                {location}
              </span>
            ) : null}
            {college.established_year ? (
              <span className="tabular-nums">Est. {college.established_year}</span>
            ) : null}
            {college.type ? <span className="capitalize">{college.type}</span> : null}
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-1.5">
            {college.naac_grade ? (
              <Badge variant="secondary" size="sm">
                NAAC {college.naac_grade}
              </Badge>
            ) : null}
            {college.nirf_rank ? (
              <Badge variant="urgent" size="sm">
                NIRF #{college.nirf_rank}
              </Badge>
            ) : null}
            {approvals.slice(0, 4).map((approval) => (
              <Badge key={approval} variant="outline" size="sm">
                {approval}
              </Badge>
            ))}
          </div>
        </div>
      </div>

      <dl className="mt-4 grid grid-cols-2 gap-3 rounded-lg bg-surface p-3 sm:grid-cols-4">
        <Stat label="Fee / year" value={fee ?? "On request"} />
        <Stat
          label="Highest package"
          value={formatInr(college.highest_package) ?? "—"}
        />
        <Stat
          label="Average package"
          value={formatInr(college.average_package) ?? "—"}
        />
        <div>
          <dt className="text-sm text-muted-foreground">Rating</dt>
          <dd className="mt-0.5">
            {college.rating && college.rating > 0 ? (
              <Rating
                value={Number(college.rating)}
                count={college.review_count}
                size="sm"
              />
            ) : (
              <span className="text-sm text-muted-foreground">Not rated yet</span>
            )}
          </dd>
        </div>
      </dl>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <LeadDialog
          source="apply_now"
          collegeId={college.id}
          title={`Apply to ${college.short_name ?? college.name}`}
          description="A counsellor will confirm eligibility, fees and the next admission date."
          fields={["city", "level", "message"]}
          submitLabel="Submit Application"
        >
          <Button>Apply Now</Button>
        </LeadDialog>

        <Button asChild variant="outline">
          <Link href={href}>Know More</Link>
        </Button>

        {/* The signed-URL brochure download is gated behind a lead in P6; the
            button only appears once a college actually has a brochure. */}
        {college.brochure_url ? (
          <LeadDialog
            source="brochure"
            collegeId={college.id}
            title="Download brochure"
            description="Enter your number and we will send the brochure and fee details."
            submitLabel="Get Brochure"
          >
            <Button variant="ghost">
              <Download />
              Brochure
            </Button>
          </LeadDialog>
        ) : null}

        <div className="ml-auto">
          <CompareToggle
            college={{ id: college.id, name: college.short_name ?? college.name, slug: college.slug }}
          />
        </div>
      </div>
    </article>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-sm text-muted-foreground">{label}</dt>
      <dd className="mt-0.5 font-semibold text-ink tabular-nums">{value}</dd>
    </div>
  );
}
