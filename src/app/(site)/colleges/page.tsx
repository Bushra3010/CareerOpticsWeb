import type { Metadata } from "next";
import Link from "next/link";
import { Fragment } from "react";

import { SearchX } from "lucide-react";

import { CollegeListCard } from "@/components/college/college-list-card";
import { FilterPanel } from "@/components/college/filter-panel";
import { MobileFilterSheet } from "@/components/college/mobile-filter-sheet";
import { SortSelect } from "@/components/college/sort-select";
import { InlineLeadCard } from "@/components/forms/inline-lead-card";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { DEFAULT_SORT, LEAD_CARD_INTERVAL } from "@/config/filters";
import { getFilterOptions, listColleges } from "@/lib/queries/colleges";
import {
  hasActiveFilters,
  loadCollegeSearchParams,
} from "@/lib/search-params/colleges";
import type { SearchParams } from "nuqs/server";

/**
 * `/colleges` — PRD §5.2.
 *
 * Filters, sort and page all live in the query string and the results are
 * rendered on the server from them. §10 requires filter/sort URLs to be
 * `noindex, follow`, so the facet combinations never compete with the
 * canonical listing — hence `generateMetadata` rather than a static export.
 *
 * §5.2 asks for "SSR first 12 + infinite scroll". This ships numbered
 * pagination instead: §11 rules out a client fetch waterfall on listing pages,
 * and paged URLs are crawlable and back-button correct on the 3G Android
 * traffic this is built for. The 24-per-page figure is unchanged.
 */
export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}): Promise<Metadata> {
  const filters = await loadCollegeSearchParams(searchParams);
  const filtered = hasActiveFilters(filters) || filters.page > 1;

  return {
    title: "Colleges in India — Fees, Courses, Admission 2026",
    description:
      "Browse colleges and universities across India. Filter by stream, city, fee, NAAC grade and approvals, and get free admission counselling.",
    alternates: { canonical: "/colleges" },
    robots: filtered ? { index: false, follow: true } : undefined,
  };
}

export default async function CollegesPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const filters = await loadCollegeSearchParams(searchParams);

  const [{ colleges, total, page, pageCount, truncated }, options] =
    await Promise.all([listColleges(filters), getFilterOptions()]);

  const activeCount = [
    filters.stream,
    filters.course,
    filters.state,
    filters.city,
    filters.ownership,
    filters.fee,
    filters.rating,
  ].filter(Boolean).length +
    filters.type.length +
    filters.naac.length +
    filters.approvals.length;

  /**
   * Preserves every filter while changing only the page. Defaults are left out
   * so page 1 of an unfiltered listing is plain `/colleges` and the pagination
   * links do not carry a redundant `sort=popularity`.
   */
  const pageHref = (target: number) => {
    const params = new URLSearchParams();
    for (const [key, value] of Object.entries(filters)) {
      if (key === "page" || value == null || value === "") continue;
      if (key === "sort" && value === DEFAULT_SORT) continue;
      if (Array.isArray(value)) {
        if (value.length) params.set(key, value.join(","));
        continue;
      }
      params.set(key, String(value));
    }
    if (target > 1) params.set("page", String(target));
    const query = params.toString();
    return query ? `/colleges?${query}` : "/colleges";
  };

  return (
    <div className="container-site py-6 lg:py-8">
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link href="/">Home</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>Colleges</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <h1 className="heading-underline mt-4 text-h2">Colleges in India</h1>

      <div className="mt-8 flex gap-8">
        {/* Desktop sidebar (§5.2) */}
        <aside className="hidden w-[264px] shrink-0 lg:block">
          <div className="sticky top-20 max-h-[calc(100dvh-6rem)] overflow-y-auto pr-1">
            <FilterPanel options={options} />
          </div>
        </aside>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-body">
              <span className="font-semibold text-ink tabular-nums">{total}</span>{" "}
              {total === 1 ? "college" : "colleges"} found
            </p>
            <div className="flex items-center gap-2">
              <MobileFilterSheet options={options} activeCount={activeCount} />
              <SortSelect />
            </div>
          </div>

          {truncated ? (
            <p className="mt-3 rounded-lg bg-brand-orange/10 p-3 text-sm text-ink">
              Showing the first 500 matches. Add a filter to narrow the list.
            </p>
          ) : null}

          {colleges.length === 0 ? (
            <div className="mt-8 rounded-xl border border-dashed p-10 text-center">
              <SearchX className="mx-auto size-8 text-muted-foreground" aria-hidden />
              <h2 className="mt-3 text-h3">No colleges match these filters</h2>
              <p className="mt-1 text-body">
                Try removing a filter, or let a counsellor shortlist for you.
              </p>
              <Button asChild variant="outline" className="mt-4">
                <Link href="/colleges">Clear all filters</Link>
              </Button>
            </div>
          ) : (
            <ul className="mt-6 grid gap-4">
              {colleges.map((college, index) => (
                <Fragment key={college.id}>
                  <li>
                    <CollegeListCard college={college} />
                  </li>
                  {/* §5.2 — counselling card after every 6th result, but not
                      dangling at the very end of the page. */}
                  {(index + 1) % LEAD_CARD_INTERVAL === 0 &&
                  index + 1 < colleges.length ? (
                    <li>
                      <InlineLeadCard />
                    </li>
                  ) : null}
                </Fragment>
              ))}
            </ul>
          )}

          {pageCount > 1 ? (
            <Pagination className="mt-8">
              <PaginationContent>
                {page > 1 ? (
                  <PaginationItem>
                    <PaginationPrevious href={pageHref(page - 1)} />
                  </PaginationItem>
                ) : null}

                {(() => { // [FIXED: PERF truncated pagination prevents hundreds of sequential links on large catalogues]
                  const items: (number | "...")[] = [];
                  const maxVisible = 5;
                  if (pageCount <= maxVisible + 2) {
                    for (let i = 1; i <= pageCount; i++) items.push(i);
                  } else {
                    items.push(1);
                    if (page > 3) items.push("...");
                    const start = Math.max(2, page - 1);
                    const end = Math.min(pageCount - 1, page + 1);
                    for (let i = start; i <= end; i++) items.push(i);
                    if (page < pageCount - 2) items.push("...");
                    items.push(pageCount);
                  }
                  return items.map((target) =>
                    target === "..." ? (
                      <PaginationItem key="ellipsis">
                        <span className="flex size-9 items-center justify-center text-sm text-muted-foreground">…</span>
                      </PaginationItem>
                    ) : (
                      <PaginationItem key={target}>
                        <PaginationLink href={pageHref(target)} isActive={target === page}>
                          {target}
                        </PaginationLink>
                      </PaginationItem>
                    ),
                  );
                })()}

                {page < pageCount ? (
                  <PaginationItem>
                    <PaginationNext href={pageHref(page + 1)} />
                  </PaginationItem>
                ) : null}
              </PaginationContent>
            </Pagination>
          ) : null}
        </div>
      </div>
    </div>
  );
}
