"use client";

import { Check } from "lucide-react";

import { cn } from "@/lib/utils";

export type FinderOption = { value: string; label: string; hint?: string | null };

/**
 * The wizard's single-select control. Big tap targets and real radio inputs —
 * this runs on 85% Android phones (§15) and has to be keyboard-navigable (§6.5).
 */
export function OptionList({
  name,
  options,
  value,
  onSelect,
  columns = 1,
}: {
  name: string;
  options: FinderOption[];
  value: string | undefined;
  onSelect: (value: string) => void;
  columns?: 1 | 2;
}) {
  if (options.length === 0) {
    return (
      <p className="rounded-xl border border-dashed p-6 text-body">
        Nothing to choose here yet. Go back a step, or skip ahead — a counsellor
        will fill the gap.
      </p>
    );
  }

  return (
    <ul
      className={cn(
        "grid gap-3",
        columns === 2 && "sm:grid-cols-2",
        // A long option list scrolls inside the card rather than pushing the
        // Next button off a small screen.
        options.length > 8 && "max-h-[320px] overflow-y-auto pr-1",
      )}
    >
      {options.map((option) => {
        const selected = value === option.value;
        return (
          <li key={option.value}>
            <label
              className={cn(
                "flex cursor-pointer items-start gap-3 rounded-xl border p-4 transition-colors has-focus-visible:ring-2 has-focus-visible:ring-ring has-focus-visible:ring-offset-2",
                selected
                  ? "border-brand-blue bg-brand-blue-50"
                  : "hover:border-brand-blue-400 hover:bg-surface",
              )}
            >
              <input
                type="radio"
                name={name}
                value={option.value}
                checked={selected}
                onChange={() => onSelect(option.value)}
                className="sr-only"
              />
              <span
                className={cn(
                  "mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full border-2",
                  selected
                    ? "border-brand-blue bg-brand-blue text-white"
                    : "border-border",
                )}
                aria-hidden
              >
                {selected ? <Check className="size-3" /> : null}
              </span>
              <span className="min-w-0">
                <span className="block font-medium text-ink">{option.label}</span>
                {option.hint ? (
                  <span className="mt-0.5 block text-sm text-muted-foreground">
                    {option.hint}
                  </span>
                ) : null}
              </span>
            </label>
          </li>
        );
      })}
    </ul>
  );
}
