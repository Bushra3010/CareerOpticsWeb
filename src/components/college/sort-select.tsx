"use client";

import { useQueryStates } from "nuqs";

import { SORT_OPTIONS } from "@/config/filters";
import { collegeSearchParams } from "@/lib/search-params/colleges";

/**
 * §5.2 sort control. Writes to the URL so a sorted view is shareable.
 *
 * A native `<select>`, not the Radix one: it saves ~15 kB on the heaviest page
 * on the site, matches the filter form's own selects, and gives Android its
 * native picker — which is a better control on a phone than a rendered popover.
 */
export function SortSelect() {
  const [filters, setFilters] = useQueryStates(collegeSearchParams, {
    shallow: false,
  });

  return (
    <div className="flex items-center gap-2">
      <label htmlFor="colleges-sort" className="shrink-0 text-sm text-muted-foreground">
        Sort by
      </label>
      <select
        id="colleges-sort"
        value={filters.sort}
        onChange={(event) =>
          void setFilters({
            sort: event.target.value as (typeof SORT_OPTIONS)[number]["value"],
            page: 1,
          })
        }
        className="h-10 w-[180px] rounded-lg border border-input bg-transparent px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
      >
        {SORT_OPTIONS.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}
