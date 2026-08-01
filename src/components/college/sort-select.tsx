"use client";

import { useQueryStates } from "nuqs";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SORT_OPTIONS } from "@/config/filters";
import { collegeSearchParams } from "@/lib/search-params/colleges";

/** §5.2 sort control. Writes to the URL so a sorted view is shareable. */
export function SortSelect() {
  const [filters, setFilters] = useQueryStates(collegeSearchParams, {
    shallow: false,
  });

  return (
    <div className="flex items-center gap-2">
      <label htmlFor="colleges-sort" className="shrink-0 text-sm text-muted-foreground">
        Sort by
      </label>
      <Select
        value={filters.sort}
        onValueChange={(value) =>
          void setFilters({
            sort: value as (typeof SORT_OPTIONS)[number]["value"],
            page: 1,
          })
        }
      >
        <SelectTrigger id="colleges-sort" className="h-10 w-[180px]">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {SORT_OPTIONS.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
