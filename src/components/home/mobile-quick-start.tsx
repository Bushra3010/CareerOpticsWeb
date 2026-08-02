import Link from "next/link";

import {
  Building2,
  BookOpen,
  ClipboardList,
  MapPin,
  Search,
} from "lucide-react";

import { GoalCitySelector } from "@/components/home/goal-city-selector";
import type { GoalCityOptions } from "@/lib/queries/home";

const EXPLORE = [
  { label: "Colleges", href: "/colleges", icon: Building2 },
  { label: "Courses", href: "/courses", icon: BookOpen },
  { label: "Exams", href: "/exams", icon: ClipboardList },
  { label: "College Finder", href: "/college-finder", icon: MapPin },
];

/**
 * Phone-only entry block (`lg:hidden`). On a handset the hero carousel is only
 * 280px tall and the search inside it competes with the headline, so search,
 * the goal/city pickers and the four main destinations are lifted above it
 * where a thumb reaches them first. Desktop keeps the header search and the
 * full-bleed hero unchanged.
 */
export function MobileQuickStart({ options }: { options: GoalCityOptions }) {
  return (
    <section aria-label="Find a college" className="lg:hidden">
      <div className="container-site pt-6 pb-5">
        {/* Deliberately a <p>, not an <h1>: the hero banner below is already
            the page's single h1 on both breakpoints, and a second one visible
            only on phones would split the document outline. */}
        <p className="font-display text-h2 text-ink">
          Find your <span className="text-brand-blue-400">dream college</span>
        </p>

        <form action="/search" role="search" className="mt-4">
          <label htmlFor="home-search" className="sr-only">
            Search colleges, courses or exams
          </label>
          <div className="flex h-12 items-center gap-2 rounded-xl border bg-white px-3 focus-within:border-brand-blue-400 focus-within:ring-2 focus-within:ring-ring">
            <Search className="size-4 shrink-0 text-muted-foreground" aria-hidden />
            <input
              id="home-search"
              name="q"
              type="search"
              placeholder="Search colleges, courses or exams"
              className="w-full bg-transparent text-sm text-ink outline-none placeholder:text-muted-foreground"
            />
          </div>
        </form>

        <div className="mt-3">
          <GoalCitySelector options={options} />
        </div>
      </div>
    </section>
  );
}

/** The four main destinations, shown under the hero on phones. */
export function MobileExplore() {
  return (
    <section aria-label="Explore" className="lg:hidden">
      <div className="container-site pt-6">
        <div className="flex items-baseline justify-between">
          <h2 className="text-h3">Explore</h2>
          <Link
            href="/colleges"
            className="text-sm font-semibold text-brand-blue-400 hover:underline"
          >
            View All
          </Link>
        </div>

        <ul className="mt-3 grid grid-cols-4 gap-2.5">
          {EXPLORE.map((item) => (
            <li key={item.href}>
              <Link
                href={item.href}
                className="flex h-full flex-col items-center gap-2 rounded-xl border bg-card p-3 text-center transition-shadow hover:shadow-card focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:outline-none"
              >
                <span className="flex size-10 items-center justify-center rounded-xl bg-brand-blue-50 text-brand-blue">
                  <item.icon className="size-5" aria-hidden />
                </span>
                <span className="text-xs font-medium text-ink">
                  {item.label}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
