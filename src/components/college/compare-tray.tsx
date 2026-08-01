"use client";

import Link from "next/link";

import { X } from "lucide-react";

import { useCompare } from "@/components/college/compare-provider";
import { Button } from "@/components/ui/button";
import { MAX_COMPARE } from "@/config/filters";

/**
 * Sticky tray listing the current compare selection. Appears only once
 * something is ticked, and sits above the mobile sticky bar.
 */
export function CompareTray() {
  const { selected, remove, clear } = useCompare();

  if (selected.length === 0) return null;

  const href = `/compare?ids=${selected.map((entry) => entry.id).join(",")}`;

  return (
    <div className="fixed inset-x-0 bottom-14 z-30 border-t bg-white shadow-[0_-4px_16px_rgb(15_23_42/0.1)] lg:bottom-0">
      <div className="container-site flex flex-wrap items-center gap-3 py-3">
        <ul className="flex min-w-0 flex-1 flex-wrap gap-2">
          {selected.map((entry) => (
            <li
              key={entry.id}
              className="flex max-w-[220px] items-center gap-1 rounded-full bg-brand-blue-50 py-1 pr-1 pl-3 text-sm font-medium text-brand-blue"
            >
              <span className="truncate">{entry.name}</span>
              <button
                type="button"
                onClick={() => remove(entry.id)}
                aria-label={`Remove ${entry.name} from comparison`}
                className="rounded-full p-0.5 hover:bg-brand-blue/10 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
              >
                <X className="size-3.5" />
              </button>
            </li>
          ))}
        </ul>

        <div className="flex shrink-0 items-center gap-2">
          <Button variant="ghost" size="sm" onClick={clear}>
            Clear
          </Button>
          {/* `asChild` renders a Link, which ignores `disabled` — so below two
              selections this has to be a real button, not a dressed-up link. */}
          {selected.length < 2 ? (
            <Button disabled>
              Compare
              <span className="tabular-nums">
                ({selected.length}/{MAX_COMPARE})
              </span>
            </Button>
          ) : (
            <Button asChild>
              <Link href={href}>
                Compare
                <span className="tabular-nums">
                  ({selected.length}/{MAX_COMPARE})
                </span>
              </Link>
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
