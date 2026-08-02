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
  dots = false,
  children,
}: {
  label: string;
  className?: string;
  /** Show page dots beneath the rail. One dot per viewport-width page. */
  dots?: boolean;
  children: React.ReactNode;
}) {
  const ref = React.useRef<HTMLDivElement>(null);
  const [atStart, setAtStart] = React.useState(true);
  const [atEnd, setAtEnd] = React.useState(true);
  const [pages, setPages] = React.useState(1);
  const [page, setPage] = React.useState(0);

  const sync = React.useCallback(() => {
    const el = ref.current;
    if (!el) return;
    setAtStart(el.scrollLeft <= 1);
    setAtEnd(el.scrollLeft + el.clientWidth >= el.scrollWidth - 1);
    const count = Math.max(1, Math.ceil(el.scrollWidth / el.clientWidth));
    setPages(count);
    setPage(Math.round(el.scrollLeft / el.clientWidth));
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

      {/* Dots are a convenience on top of the rail, which already scrolls and
          is keyboard-reachable on its own — so they are hidden from assistive
          tech rather than duplicating the same navigation. */}
      {dots && pages > 1 ? (
        <div className="mt-5 flex justify-center gap-2" aria-hidden>
          <div className="flex gap-2">
            {Array.from({ length: pages }, (_, index) => (
              <button
                key={index}
                type="button"
                tabIndex={-1}
                onClick={() =>
                  ref.current?.scrollTo({
                    left: index * ref.current.clientWidth,
                    behavior: "smooth",
                  })
                }
                className={
                  index === page
                    ? "h-2 w-6 rounded-full bg-ink transition-all"
                    : "size-2 rounded-full bg-border transition-all hover:bg-muted-ink"
                }
              />
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
