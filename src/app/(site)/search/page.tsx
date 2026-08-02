import type { Metadata } from "next";
import Link from "next/link";

import { Building2, BookOpen, FileText, SearchX } from "lucide-react";

import { InlineLeadCard } from "@/components/forms/inline-lead-card";
import { PageHeader } from "@/components/taxonomy/page-header";
import { Badge } from "@/components/ui/badge";
import { LEVEL_LABELS } from "@/lib/queries/taxonomy";
import { MIN_QUERY_LENGTH, search } from "@/lib/queries/search";

/** Search results are generated from a query string — never a landing page (§10). */
export const metadata: Metadata = {
  title: "Search",
  robots: { index: false, follow: true },
};

/** `/search?q=` — global search results (§4, §8). */
export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q = "" } = await searchParams;
  const query = q.trim();
  const results = await search(query);

  const groups = [
    {
      key: "colleges",
      title: "Colleges",
      icon: Building2,
      items: results.colleges.map((college) => ({
        id: college.id,
        href: `/colleges/${college.slug}`,
        title: college.name,
        meta: [college.cities?.name, college.cities?.states?.name]
          .filter(Boolean)
          .join(", "),
        badge: college.naac_grade ? `NAAC ${college.naac_grade}` : null,
      })),
      allHref: `/colleges`,
    },
    {
      key: "courses",
      title: "Courses",
      icon: BookOpen,
      items: results.courses.map((course) => ({
        id: course.id,
        href: `/courses/${course.slug}`,
        title: course.name,
        meta: course.streams?.name ?? "",
        badge: course.level ? (LEVEL_LABELS[course.level] ?? course.level) : null,
      })),
      allHref: `/courses`,
    },
    {
      key: "exams",
      title: "Exams",
      icon: FileText,
      items: results.exams.map((exam) => ({
        id: exam.id,
        href: `/exams/${exam.slug}`,
        title: exam.name,
        meta: exam.conducting_body ?? "",
        badge: null,
      })),
      allHref: `/exams`,
    },
  ].filter((group) => group.items.length > 0);

  return (
    <>
      <PageHeader
        crumbs={[{ name: "Search" }]}
        title={query ? `Results for “${query}”` : "Search"}
        description={
          query
            ? `${results.total} match${results.total === 1 ? "" : "es"} across colleges, courses and exams.`
            : "Search colleges, courses and entrance exams."
        }
      >
        <form action="/search" role="search" className="max-w-xl">
          <label htmlFor="search-page-input" className="sr-only">
            Search colleges, courses and exams
          </label>
          <div className="flex gap-2">
            <input
              id="search-page-input"
              name="q"
              type="search"
              defaultValue={query}
              placeholder="Search for colleges, exams, courses and more.."
              className="h-11 w-full rounded-lg border border-input bg-white px-3 text-base outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 md:text-sm"
            />
            <button
              type="submit"
              className="h-11 shrink-0 rounded-lg bg-primary px-5 font-semibold text-primary-foreground hover:bg-brand-red-600 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:outline-none"
            >
              Search
            </button>
          </div>
        </form>
      </PageHeader>

      <div className="container-site py-8 lg:py-12">
        {query.length < MIN_QUERY_LENGTH ? (
          <p className="rounded-xl border border-dashed p-6 text-body">
            Type at least {MIN_QUERY_LENGTH} characters to search.
          </p>
        ) : groups.length === 0 ? (
          <div>
            <div className="rounded-xl border border-dashed p-10 text-center">
              <SearchX className="mx-auto size-8 text-muted-foreground" aria-hidden />
              <h2 className="mt-3 text-h3">Nothing matched “{query}”</h2>
              <p className="mt-1 text-body">
                Try a shorter word, or let a counsellor find it for you.
              </p>
            </div>
            <div className="mt-6">
              <InlineLeadCard />
            </div>
          </div>
        ) : (
          <div className="grid gap-10">
            {groups.map((group) => (
              <section key={group.key} aria-labelledby={`${group.key}-title`}>
                <div className="flex items-center justify-between gap-3">
                  <h2
                    id={`${group.key}-title`}
                    className="flex items-center gap-2 text-h3"
                  >
                    <group.icon className="size-5 text-brand-blue-400" aria-hidden />
                    {group.title}
                    <span className="text-base font-normal text-muted-foreground tabular-nums">
                      ({group.items.length})
                    </span>
                  </h2>
                  <Link
                    href={group.allHref}
                    className="text-sm font-semibold text-brand-blue-400 hover:underline"
                  >
                    Browse all
                  </Link>
                </div>

                <ul className="mt-4 grid gap-3">
                  {group.items.map((item) => (
                    <li key={item.id}>
                      <Link
                        href={item.href}
                        className="card-lift flex flex-wrap items-center justify-between gap-3 rounded-xl border bg-card p-4 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:outline-none"
                      >
                        <span className="min-w-0">
                          <span className="block font-semibold text-ink">
                            {item.title}
                          </span>
                          {item.meta ? (
                            <span className="block text-sm text-muted-foreground">
                              {item.meta}
                            </span>
                          ) : null}
                        </span>
                        {item.badge ? (
                          <Badge variant="secondary" size="sm">
                            {item.badge}
                          </Badge>
                        ) : null}
                      </Link>
                    </li>
                  ))}
                </ul>
              </section>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
