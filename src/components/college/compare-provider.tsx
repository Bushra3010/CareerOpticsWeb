"use client";

import * as React from "react";

import { MAX_COMPARE } from "@/config/filters";

export type CompareEntry = { id: string; name: string; slug: string };

type CompareContextValue = {
  selected: CompareEntry[];
  isSelected: (id: string) => boolean;
  toggle: (entry: CompareEntry) => void;
  remove: (id: string) => void;
  clear: () => void;
  full: boolean;
};

const CompareContext = React.createContext<CompareContextValue | null>(null);

const STORAGE_KEY = "careeroptics:compare";

/**
 * Compare selection (§4, `/compare?ids=a,b,c`).
 *
 * Selection is not URL state: it has to survive filtering and paging, and
 * putting it in the query string would collide with the filter params. It is
 * kept in localStorage instead, so a student can tick a college, change the
 * filters, tick two more and still land on a three-way comparison.
 */
export function CompareProvider({ children }: { children: React.ReactNode }) {
  const [selected, setSelected] = React.useState<CompareEntry[]>([]);

  // Read after mount — localStorage does not exist during the server render,
  // and seeding state from it directly would cause a hydration mismatch.
  React.useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (!stored) return;
      const parsed: unknown = JSON.parse(stored);
      if (Array.isArray(parsed)) {
        setSelected(
          parsed
            .filter(
              (entry): entry is CompareEntry =>
                Boolean(entry) &&
                typeof entry === "object" &&
                typeof (entry as CompareEntry).id === "string",
            )
            .slice(0, MAX_COMPARE),
        );
      }
    } catch {
      // Corrupt or unavailable storage is not worth breaking the page over.
    }
  }, []);

  const persist = React.useCallback((next: CompareEntry[]) => {
    setSelected(next);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {
      // Private mode / quota — selection still works for this page view.
    }
  }, []);

  const value = React.useMemo<CompareContextValue>(
    () => ({
      selected,
      isSelected: (id) => selected.some((entry) => entry.id === id),
      toggle: (entry) => {
        const exists = selected.some((item) => item.id === entry.id);
        if (exists) {
          persist(selected.filter((item) => item.id !== entry.id));
        } else if (selected.length < MAX_COMPARE) {
          persist([...selected, entry]);
        }
      },
      remove: (id) => persist(selected.filter((entry) => entry.id !== id)),
      clear: () => persist([]),
      full: selected.length >= MAX_COMPARE,
    }),
    [selected, persist],
  );

  return (
    <CompareContext.Provider value={value}>{children}</CompareContext.Provider>
  );
}

export function useCompare() {
  const context = React.useContext(CompareContext);
  if (!context) {
    throw new Error("useCompare must be used within a <CompareProvider />");
  }
  return context;
}
