/**
 * Listing filter vocabulary — PRD §5.2.
 *
 * Values that map to a database enum or column are written exactly as stored,
 * so a filter never needs a translation step in the query layer.
 */

export type FilterOption = { value: string; label: string };

/** `colleges.type` (college_type enum). */
export const COLLEGE_TYPES: FilterOption[] = [
  { value: "government", label: "Government" },
  { value: "state", label: "State" },
  { value: "central", label: "Central" },
  { value: "deemed", label: "Deemed" },
  { value: "autonomous", label: "Autonomous" },
  { value: "private", label: "Private" },
];

/**
 * §5.2 lists Ownership and College Type separately, but the schema has one
 * `type` column. Ownership is therefore the coarse grouping over it — a
 * student who wants "government" does not care which of the three flavours.
 */
export const OWNERSHIP: { value: string; label: string; types: string[] }[] = [
  { value: "government", label: "Government", types: ["government", "state", "central"] },
  { value: "private", label: "Private", types: ["private", "deemed", "autonomous"] },
];

/** `colleges.naac_grade`, best first. */
export const NAAC_GRADES: FilterOption[] = [
  { value: "A++", label: "A++" },
  { value: "A+", label: "A+" },
  { value: "A", label: "A" },
  { value: "B++", label: "B++" },
  { value: "B+", label: "B+" },
  { value: "B", label: "B" },
];

/** Members of the `colleges.approvals` text[]. */
export const APPROVALS: FilterOption[] = [
  { value: "UGC", label: "UGC" },
  { value: "AICTE", label: "AICTE" },
  { value: "NAAC", label: "NAAC" },
  { value: "NBA", label: "NBA" },
  { value: "NCTE", label: "NCTE" },
  { value: "PCI", label: "PCI" },
  { value: "BCI", label: "BCI" },
  { value: "MCI", label: "MCI" },
  { value: "AIU", label: "AIU" },
];

/** Upper bounds for the fee slider, matched against `college_courses.fee_per_year`. */
export const FEE_BANDS: FilterOption[] = [
  { value: "50000", label: "Under ₹50,000" },
  { value: "100000", label: "Under ₹1 Lakh" },
  { value: "200000", label: "Under ₹2 Lakh" },
  { value: "500000", label: "Under ₹5 Lakh" },
  { value: "1000000", label: "Under ₹10 Lakh" },
];

export const RATINGS: FilterOption[] = [
  { value: "4.5", label: "4.5 and above" },
  { value: "4", label: "4.0 and above" },
  { value: "3.5", label: "3.5 and above" },
  { value: "3", label: "3.0 and above" },
];

export const SORT_OPTIONS = [
  { value: "popularity", label: "Popularity" },
  { value: "fee-asc", label: "Fee: Low to High" },
  { value: "nirf", label: "NIRF Rank" },
  { value: "rating", label: "Rating" },
] as const;

export type SortValue = (typeof SORT_OPTIONS)[number]["value"];
export const DEFAULT_SORT: SortValue = "popularity";

/** §5.2 — 24 results per page. */
export const PAGE_SIZE = 24;

/** §5.2 — inline counselling card after every Nth result. */
export const LEAD_CARD_INTERVAL = 6;

/** Maximum colleges that can sit in the compare tray (§4). */
export const MAX_COMPARE = 3;
