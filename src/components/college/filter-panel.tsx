"use client";

import * as React from "react";

import { useQueryStates } from "nuqs";
import { ChevronDown, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  APPROVALS,
  COLLEGE_TYPES,
  FEE_BANDS,
  NAAC_GRADES,
  OWNERSHIP,
  RATINGS,
  type FilterOption,
} from "@/config/filters";
import type { FilterOptions } from "@/lib/queries/colleges";
import { collegeSearchParams } from "@/lib/search-params/colleges";

/**
 * §5.2 filter set. Every control writes to the URL through nuqs with
 * `shallow: false`, so the server re-runs the query and results stay SSR —
 * there is no client fetch waterfall (§11), and any filtered view is
 * shareable and back-button correct.
 */
export function FilterPanel({
  options,
  showTitle = true,
  onApplied,
}: {
  options: FilterOptions;
  /** The mobile sheet supplies its own title, so it turns this one off. */
  showTitle?: boolean;
  /** Lets the mobile sheet close itself after a change. */
  onApplied?: () => void;
}) {
  const [filters, setFilters] = useQueryStates(collegeSearchParams, {
    shallow: false,
    // Any filter change invalidates the current page number.
    history: "push",
  });

  const update = (patch: Partial<typeof filters>) => {
    void setFilters({ ...patch, page: 1 });
    onApplied?.();
  };

  const toggleIn = (list: string[], value: string) =>
    list.includes(value) ? list.filter((v) => v !== value) : [...list, value];

  // A city list of 120 is unusable until a state narrows it.
  const cities = filters.state
    ? options.cities.filter((city) => city.state === filters.state)
    : options.cities;

  const clearAll = () =>
    void setFilters({
      stream: null,
      course: null,
      state: null,
      city: null,
      type: null,
      ownership: null,
      naac: null,
      approvals: null,
      fee: null,
      rating: null,
      page: 1,
    });

  return (
    <div>
      <div className="flex items-center justify-between pb-2">
        {showTitle ? (
          <h2 className="font-display text-base font-bold text-ink">Filters</h2>
        ) : (
          <span />
        )}
        <Button variant="link" size="sm" onClick={clearAll} className="h-auto p-0">
          <X className="size-3.5" />
          Clear all
        </Button>
      </div>

      <div>
        <Group value="stream" defaultOpen label="Stream">
          <Radio
            name="stream"
            options={options.streams.map((s) => ({ value: s.slug, label: s.name }))}
            selected={filters.stream}
            onSelect={(value) => update({ stream: value })}
          />
        </Group>

        <Group value="course" label="Course">
          <Radio
            name="course"
            options={options.courses.map((c) => ({ value: c.slug, label: c.name }))}
            selected={filters.course}
            onSelect={(value) => update({ course: value })}
          />
        </Group>

        <Group value="location" defaultOpen label="State & city">
          <p className="pb-1 text-sm font-semibold text-ink">State</p>
          <Radio
            name="state"
            options={options.states.map((s) => ({ value: s.slug, label: s.name }))}
            selected={filters.state}
            // Changing state invalidates a city chosen in the previous one.
            // "" is the parser default, so nuqs drops it from the URL.
            onSelect={(value) => update({ state: value, city: "" })}
          />
          <p className="pt-3 pb-1 text-sm font-semibold text-ink">City</p>
          {cities.length > 0 ? (
            <Radio
              name="city"
              options={cities.map((c) => ({ value: c.slug, label: c.name }))}
              selected={filters.city}
              onSelect={(value) => update({ city: value })}
            />
          ) : (
            <p className="text-sm text-muted-foreground">No cities in this state.</p>
          )}
        </Group>

        <Group value="type" defaultOpen label="College type">
          <p className="pb-1 text-sm font-semibold text-ink">Ownership</p>
          <Radio
            name="ownership"
            options={OWNERSHIP.map((o) => ({ value: o.value, label: o.label }))}
            selected={filters.ownership}
            onSelect={(value) => update({ ownership: value })}
          />
          <p className="pt-3 pb-1 text-sm font-semibold text-ink">Type</p>
          <Checkboxes
            options={COLLEGE_TYPES}
            selected={filters.type}
            onToggle={(value) => update({ type: toggleIn(filters.type, value) })}
          />
        </Group>

        <Group value="naac" label="NAAC grade">
          <Checkboxes
            options={NAAC_GRADES}
            selected={filters.naac}
            onToggle={(value) => update({ naac: toggleIn(filters.naac, value) })}
          />
        </Group>

        <Group value="fee" defaultOpen label="Fee per year">
          <Radio
            name="fee"
            options={FEE_BANDS}
            selected={filters.fee ? String(filters.fee) : ""}
            onSelect={(value) => update({ fee: value ? Number(value) : null })}
          />
        </Group>

        <Group value="approvals" label="Approvals">
          <Checkboxes
            options={APPROVALS}
            selected={filters.approvals}
            onToggle={(value) =>
              update({ approvals: toggleIn(filters.approvals, value) })
            }
          />
        </Group>

        <Group value="rating" label="Rating">
          <Radio
            name="rating"
            options={RATINGS}
            selected={filters.rating ? String(filters.rating) : ""}
            onSelect={(value) => update({ rating: value ? Number(value) : null })}
          />
        </Group>
      </div>
    </div>
  );
}

/**
 * A filter group.
 *
 * Native `<details>` rather than the Radix Accordion: it drops ~8 kB of JS
 * from the listing page's first load, and the panel expands and collapses
 * before React hydrates — which matters most on the slow Android connections
 * this is built for (§11, §15).
 */
function Group({
  value,
  label,
  defaultOpen = false,
  children,
}: {
  value: string;
  label: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
}) {
  return (
    <details
      open={defaultOpen}
      className="group not-last:border-b"
      data-group={value}
    >
      <summary className="flex cursor-pointer list-none items-center justify-between py-3 text-base font-semibold text-ink marker:content-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none">
        {label}
        <ChevronDown
          className="size-4 shrink-0 text-muted-foreground transition-transform group-open:rotate-180"
          aria-hidden
        />
      </summary>
      {/* Long option lists scroll inside the group rather than pushing the
          rest of the sidebar off-screen. */}
      <div className="max-h-56 overflow-y-auto pr-1 pb-3">{children}</div>
    </details>
  );
}

/** Single-select. Clicking the selected option clears it, so there is no dead end. */
function Radio({
  name,
  options,
  selected,
  onSelect,
}: {
  name: string;
  options: FilterOption[];
  selected: string;
  onSelect: (value: string) => void;
}) {
  return (
    <ul className="grid gap-0.5">
      {options.map((option) => {
        const checked = selected === option.value;
        return (
          <li key={option.value}>
            <label className="flex cursor-pointer items-center gap-2 rounded-lg px-1 py-1.5 text-sm text-body hover:bg-brand-blue-50 has-focus-visible:ring-2 has-focus-visible:ring-ring">
              <input
                type="radio"
                name={name}
                checked={checked}
                onChange={() => onSelect(option.value)}
                onClick={() => checked && onSelect("")}
                className="size-4 accent-brand-blue"
              />
              {option.label}
            </label>
          </li>
        );
      })}
    </ul>
  );
}

function Checkboxes({
  options,
  selected,
  onToggle,
}: {
  options: FilterOption[];
  selected: string[];
  onToggle: (value: string) => void;
}) {
  return (
    <ul className="grid gap-0.5">
      {options.map((option) => (
        <li key={option.value}>
          <label className="flex cursor-pointer items-center gap-2 rounded-lg px-1 py-1.5 text-sm text-body hover:bg-brand-blue-50 has-focus-visible:ring-2 has-focus-visible:ring-ring">
            <input
              type="checkbox"
              checked={selected.includes(option.value)}
              onChange={() => onToggle(option.value)}
              className="size-4 accent-brand-blue"
            />
            {option.label}
          </label>
        </li>
      ))}
    </ul>
  );
}
