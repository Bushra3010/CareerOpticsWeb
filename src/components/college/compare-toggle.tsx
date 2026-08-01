"use client";

import { useCompare, type CompareEntry } from "@/components/college/compare-provider";
import { MAX_COMPARE } from "@/config/filters";

/** §5.2 card affordance — a real checkbox with a real label. */
export function CompareToggle({ college }: { college: CompareEntry }) {
  const { isSelected, toggle, full } = useCompare();
  const checked = isSelected(college.id);
  const disabled = !checked && full;

  return (
    <label
      className="flex cursor-pointer items-center gap-1.5 text-sm font-medium text-body has-disabled:cursor-not-allowed has-disabled:opacity-50 has-focus-visible:ring-2 has-focus-visible:ring-ring"
      title={disabled ? `You can compare up to ${MAX_COMPARE} colleges` : undefined}
    >
      <input
        type="checkbox"
        checked={checked}
        disabled={disabled}
        onChange={() => toggle(college)}
        className="size-4 accent-brand-blue"
      />
      Compare
    </label>
  );
}
