"use client";

import dynamic from "next/dynamic";
import * as React from "react";

import { SlidersHorizontal } from "lucide-react";

import { Button } from "@/components/ui/button";
import type { FilterOptions } from "@/lib/queries/colleges";

const FilterSheetBody = dynamic(
  () =>
    import("@/components/college/filter-sheet-body").then((m) => m.FilterSheetBody),
  { ssr: false },
);

/**
 * §5.2 — filters live in a bottom sheet on mobile. Only the trigger ships on
 * first load; the sheet and the whole filter panel arrive on first tap (§11).
 */
export function MobileFilterSheet({
  options,
  activeCount,
}: {
  options: FilterOptions;
  activeCount: number;
}) {
  const [open, setOpen] = React.useState(false);
  const [loaded, setLoaded] = React.useState(false);

  return (
    <>
      <Button
        variant="outline"
        className="h-10 lg:hidden"
        aria-expanded={open}
        onClick={() => {
          setLoaded(true);
          setOpen(true);
        }}
      >
        <SlidersHorizontal />
        Filters
        {activeCount > 0 ? (
          <span className="ml-1 rounded-full bg-brand-blue px-1.5 text-sm font-semibold text-white tabular-nums">
            {activeCount}
          </span>
        ) : null}
      </Button>

      {loaded ? (
        <FilterSheetBody open={open} onOpenChange={setOpen} options={options} />
      ) : null}
    </>
  );
}
