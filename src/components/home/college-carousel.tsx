import Image from "next/image";
import Link from "next/link";

import { ChevronRight, MapPin, Star } from "lucide-react";

import { CollegeCard } from "@/components/college/college-card";
import { ScrollRow } from "@/components/home/scroll-row";
import type { FeaturedCollege } from "@/lib/queries/home";
import { imageSrc, initials } from "@/lib/media";

const TYPE_LABELS: Record<string, string> = {
  private: "Private University",
  government: "Government",
  deemed: "Deemed University",
  autonomous: "Autonomous",
  state: "State University",
  central: "Central University",
};

/** §5.1 item 7 — "Top Universities". */
export function CollegeCarousel({ colleges }: { colleges: FeaturedCollege[] }) {
  return (
    <>
      {/* Phones get scannable list rows. The full card is 280px wide and tall
          enough that only one fits a handset screen, so comparing colleges
          means a lot of horizontal swiping on the traffic this is built for. */}
      <ul className="flex flex-col gap-3 lg:hidden">
        {colleges.map((college) => (
          <li key={college.id}>
            <CollegeRow college={college} />
          </li>
        ))}
      </ul>

      <div className="hidden lg:block">
        <ScrollRow label="Top universities" className="items-stretch">
          {colleges.map((college) => (
            <CollegeCard
              key={college.id}
              college={college}
              className="w-[280px] shrink-0 snap-start"
            />
          ))}
        </ScrollRow>
      </div>
    </>
  );
}

function CollegeRow({ college }: { college: FeaturedCollege }) {
  const logo = imageSrc(college.logo_url);
  const city = college.cities?.name;
  const state = college.cities?.states?.name;
  const type = college.type ? TYPE_LABELS[college.type] : null;
  const rating = Number(college.rating ?? 0);

  return (
    <Link
      href={`/colleges/${college.slug}`}
      className="flex items-center gap-3 rounded-xl border bg-card p-3 transition-shadow hover:shadow-card focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:outline-none"
    >
      <span className="relative flex size-14 shrink-0 items-center justify-center overflow-hidden rounded-xl border bg-white">
        {logo ? (
          <Image
            src={logo}
            alt=""
            fill
            sizes="56px"
            className="object-contain p-1"
          />
        ) : (
          <span className="font-display text-sm font-bold text-brand-blue">
            {initials(college.short_name ?? college.name)}
          </span>
        )}
      </span>

      <span className="min-w-0 flex-1">
        <span className="block truncate font-semibold text-ink">
          {college.name}
        </span>
        {city ? (
          <span className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
            <MapPin className="size-3 shrink-0" aria-hidden />
            <span className="truncate">
              {city}
              {state ? `, ${state}` : ""}
            </span>
          </span>
        ) : null}
        <span className="mt-1 flex items-center gap-2 text-xs">
          {rating > 0 ? (
            <span className="flex items-center gap-1 font-semibold text-ink tabular-nums">
              <Star
                className="size-3 fill-brand-amber text-brand-amber"
                aria-hidden
              />
              {rating.toFixed(1)}
            </span>
          ) : null}
          {rating > 0 && type ? (
            <span className="text-border" aria-hidden>
              |
            </span>
          ) : null}
          {type ? (
            <span className="truncate text-muted-foreground">{type}</span>
          ) : null}
        </span>
      </span>

      <ChevronRight
        className="size-5 shrink-0 text-muted-foreground"
        aria-hidden
      />
    </Link>
  );
}
