import Image from "next/image";
import Link from "next/link";

import { CalendarDays, Globe, MapPin, Users } from "lucide-react";

import { CoverPlate } from "@/components/college/cover-plate";
import { Badge } from "@/components/ui/badge";
import { coverCredit } from "@/config/image-credits";
import { Rating } from "@/components/ui/rating";
import type { College } from "@/lib/queries/college-detail";
import { imageSrc, initials } from "@/lib/media";

/** §5.3 — hero banner with the logo overlay, name, location and credentials. */
export function CollegeHero({ college }: { college: College }) {
  const cover = imageSrc(college.cover_url);
  const logo = imageSrc(college.logo_url);
  const location = [college.cities?.name, college.cities?.states?.name]
    .filter(Boolean)
    .join(", ");
  const approvals = college.approvals ?? [];
  const credit = coverCredit(college.slug);

  return (
    <header>
      <div className="relative h-40 bg-brand-blue-900 lg:h-56">
        {cover ? (
          <Image
            src={cover}
            alt=""
            fill
            priority
            sizes="100vw"
            className="object-cover object-[50%_60%]"
          />
        ) : (
          <CoverPlate name={college.short_name ?? college.name} seed={college.slug} />
        )}
        {/* The scrim exists to hold white text over a photo. The plate is already
            navy, so applying it there just greys out the initials. */}
        {cover ? (
          <div className="absolute inset-0 bg-brand-blue-900/45" aria-hidden />
        ) : null}
        {/* CC BY-SA requires credit wherever the photo is shown. */}
        {cover && credit ? (
          <p className="absolute bottom-1 right-1 rounded bg-brand-blue-900/60 px-1.5 py-0.5 text-[11px] leading-tight text-white/85">
            Photo:{" "}
            <a
              href={credit.sourceUrl}
              target="_blank"
              rel="noopener noreferrer license"
              className="underline underline-offset-2 hover:text-white"
            >
              {credit.author}
            </a>{" "}
            <a
              href={credit.licenseUrl}
              target="_blank"
              rel="noopener noreferrer license"
              className="underline underline-offset-2 hover:text-white"
            >
              {credit.license}
            </a>
          </p>
        ) : null}
      </div>

      {/* `relative` is load-bearing: the banner above is positioned, so it
          paints over this block and would swallow the overlapping logo plate. */}
      <div className="container-site relative z-10">
        {/* Only the logo plate overlaps the banner. The heading sits below it —
            `text-ink` over the navy band would fail the §6.5 contrast floor. */}
        <div className="-mt-10">
          <div className="flex size-20 items-center justify-center overflow-hidden rounded-xl border-4 border-white bg-white shadow-card">
            {logo ? (
              <Image
                src={logo}
                alt=""
                width={80}
                height={80}
                className="size-full object-contain p-1.5"
              />
            ) : (
              <span
                className="font-display text-h3 font-extrabold text-brand-blue"
                aria-hidden
              >
                {initials(college.short_name ?? college.name)}
              </span>
            )}
          </div>

          <div className="mt-4">
            <h1 className="text-h2 lg:text-h1">{college.name}</h1>
            <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-body">
              {location ? (
                <span className="flex items-center gap-1">
                  <MapPin className="size-4 shrink-0 text-brand-blue-400" aria-hidden />
                  {college.address ?? location}
                  {college.cities?.slug ? (
                    <Link
                      href={`/city/${college.cities.slug}`}
                      className="font-medium text-brand-blue-400 hover:underline"
                    >
                      (all colleges here)
                    </Link>
                  ) : null}
                </span>
              ) : null}
              {college.established_year ? (
                <span className="flex items-center gap-1 tabular-nums">
                  <CalendarDays className="size-4 shrink-0 text-brand-blue-400" aria-hidden />
                  Est. {college.established_year}
                </span>
              ) : null}
              {college.total_students ? (
                <span className="flex items-center gap-1 tabular-nums">
                  <Users className="size-4 shrink-0 text-brand-blue-400" aria-hidden />
                  {college.total_students.toLocaleString("en-IN")} students
                </span>
              ) : null}
              {college.website ? (
                <a
                  href={college.website}
                  target="_blank"
                  rel="noopener noreferrer nofollow"
                  className="flex items-center gap-1 font-medium text-brand-blue-400 hover:underline"
                >
                  <Globe className="size-4 shrink-0" aria-hidden />
                  Official website
                </a>
              ) : null}
            </div>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-2">
          {college.naac_grade ? (
            <Badge variant="secondary">NAAC {college.naac_grade}</Badge>
          ) : null}
          {college.nirf_rank ? (
            <Badge variant="urgent">NIRF #{college.nirf_rank}</Badge>
          ) : null}
          {college.type ? (
            <Badge variant="outline" className="capitalize">
              {college.type}
            </Badge>
          ) : null}
          {approvals.map((approval) => (
            <Badge key={approval} variant="outline">
              {approval}
            </Badge>
          ))}
          {college.rating && college.rating > 0 ? (
            <Rating
              value={Number(college.rating)}
              count={college.review_count}
              size="sm"
              className="ml-1"
            />
          ) : null}
        </div>
      </div>
    </header>
  );
}
