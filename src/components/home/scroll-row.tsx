"use client";

import * as React from "react";

import { ChevronLeft, ChevronRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/**
 * Horizontal scroll rail with snap points and edge arrows (§5.1 items 5, 15).
 *
 * Uses native overflow rather than Embla so the children stay plain server-
 * rendered markup — the row scrolls, wraps and is reachable by keyboard even
 * before this component hydrates.
 */
export function ScrollRow({
  label,
  className,
  children,
}: {
  label: string;
  className?: string;
  children: React.ReactNode;
}) {
  const ref = React.useRef<HTMLDivElement>(null);
  const [atStart, setAtStart] = React.useState(true);
  const [atEnd, setAtEnd] = React.useState(true);

  const sync = React.useCallback(() => {
    const el = ref.current;
    if (!el) return;
    setAtStart(el.scrollLeft <= 1);
    setAtEnd(el.scrollLeft + el.clientWidth >= el.scrollWidth - 1);
  }, []);

  React.useEffect(() => {
    sync();
    const el = ref.current;
    if (!el) return;
    const observer = new ResizeObserver(sync);
    observer.observe(el);
    return () => observer.disconnect();
  }, [sync]);

  const scrollBy = (direction: 1 | -1) => {
    const el = ref.current;
    if (!el) return;
    el.scrollBy({ left: direction * el.clientWidth * 0.8, behavior: "smooth" });
  };

  return (
    <div className="relative">
      <div
        ref={ref}
        onScroll={sync}
        role="group"
        aria-label={label}
        tabIndex={0}
        className={cn(
          "-mx-4 flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-2 [scrollbar-width:none] focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:outline-none lg:mx-0 lg:px-0 [&::-webkit-scrollbar]:hidden",
          className,
        )}
      >
        {children}
      </div>

      {!atStart ? (
        <Button
          variant="inverse"
          size="icon"
          aria-label={`Scroll ${label} left`}
          onClick={() => scrollBy(-1)}
          className="absolute top-1/2 -left-3 hidden -translate-y-1/2 rounded-full shadow-card lg:inline-flex"
        >
          <ChevronLeft className="size-5" />
        </Button>
      ) : null}
      {!atEnd ? (
        <Button
          variant="inverse"
          size="icon"
          aria-label={`Scroll ${label} right`}
          onClick={() => scrollBy(1)}
          className="absolute top-1/2 -right-3 hidden -translate-y-1/2 rounded-full shadow-card lg:inline-flex"
        >
          <ChevronRight className="size-5" />
        </Button>
      ) : null}
    </div>
  );
}
