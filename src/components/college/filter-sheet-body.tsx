"use client";

import { FilterPanel } from "@/components/college/filter-panel";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import type { FilterOptions } from "@/lib/queries/colleges";

/**
 * Mobile filter sheet body — lazy-loaded by MobileFilterSheet.
 *
 * The sheet deliberately stays open as filters are applied: results update
 * behind it, and a "Show results" button closes it, so a student can stack
 * three filters without reopening the sheet each time.
 */
export function FilterSheetBody({
  open,
  onOpenChange,
  options,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  options: FilterOptions;
}) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="max-h-[85dvh] overflow-y-auto p-0">
        <SheetHeader className="sticky top-0 z-10 border-b bg-white">
          <SheetTitle>Filter colleges</SheetTitle>
        </SheetHeader>

        <div className="px-4 pb-2">
          <FilterPanel options={options} showTitle={false} />
        </div>

        <SheetFooter className="sticky bottom-0 border-t bg-white">
          <Button size="lg" onClick={() => onOpenChange(false)}>
            Show results
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
