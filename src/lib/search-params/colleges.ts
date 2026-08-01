import {
  createLoader,
  parseAsArrayOf,
  parseAsFloat,
  parseAsInteger,
  parseAsString,
  parseAsStringLiteral,
} from "nuqs/server";

import { DEFAULT_SORT, SORT_OPTIONS } from "@/config/filters";

/**
 * URL state for `/colleges` — PRD §5.2 requires every filter to live in the
 * query string. Parsers are declared once and shared: the page loads them on
 * the server, `useQueryStates` binds the same object in the filter panel, so
 * the two can never drift.
 */
export const collegeSearchParams = {
  stream: parseAsString.withDefault(""),
  course: parseAsString.withDefault(""),
  state: parseAsString.withDefault(""),
  city: parseAsString.withDefault(""),
  type: parseAsArrayOf(parseAsString).withDefault([]),
  ownership: parseAsString.withDefault(""),
  naac: parseAsArrayOf(parseAsString).withDefault([]),
  approvals: parseAsArrayOf(parseAsString).withDefault([]),
  fee: parseAsInteger,
  rating: parseAsFloat,
  sort: parseAsStringLiteral(SORT_OPTIONS.map((o) => o.value)).withDefault(
    DEFAULT_SORT,
  ),
  page: parseAsInteger.withDefault(1),
};

export const loadCollegeSearchParams = createLoader(collegeSearchParams);

export type CollegeFilters = Awaited<
  ReturnType<typeof loadCollegeSearchParams>
>;

/** True when anything other than sort/page is set — drives the "Clear all" affordance. */
export function hasActiveFilters(filters: CollegeFilters) {
  return Boolean(
    filters.stream ||
      filters.course ||
      filters.state ||
      filters.city ||
      filters.ownership ||
      filters.type.length ||
      filters.naac.length ||
      filters.approvals.length ||
      filters.fee ||
      filters.rating,
  );
}
