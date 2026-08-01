import { Star } from "lucide-react";

import { cn } from "@/lib/utils";

const SIZES = {
  sm: "size-3.5",
  default: "size-4",
  lg: "size-5",
} as const;

/**
 * Read-only star rating. Renders a real accessible value, not just stars —
 * screen readers get "Rated 4.5 out of 5", sighted users get the stars.
 * Half stars are drawn by clipping a filled star over an empty one.
 */
export function Rating({
  value,
  count,
  size = "default",
  showValue = true,
  className,
}: {
  value: number;
  count?: number | null;
  size?: keyof typeof SIZES;
  showValue?: boolean;
  className?: string;
}) {
  const clamped = Math.max(0, Math.min(5, value));

  return (
    <span
      className={cn("inline-flex items-center gap-1.5", className)}
      role="img"
      aria-label={`Rated ${clamped} out of 5${count ? ` from ${count} reviews` : ""}`}
    >
      <span className="inline-flex" aria-hidden>
        {[0, 1, 2, 3, 4].map((index) => {
          const fill = Math.max(0, Math.min(1, clamped - index));
          return (
            <span key={index} className="relative inline-block">
              <Star className={cn(SIZES[size], "text-border")} />
              {fill > 0 ? (
                <span
                  className="absolute inset-0 overflow-hidden"
                  style={{ width: `${fill * 100}%` }}
                >
                  <Star
                    className={cn(
                      SIZES[size],
                      "fill-brand-amber text-brand-amber",
                    )}
                  />
                </span>
              ) : null}
            </span>
          );
        })}
      </span>
      {showValue ? (
        <span className="text-sm font-semibold text-ink tabular-nums">
          {clamped.toFixed(1)}
          {count ? (
            <span className="ml-1 font-normal text-muted-foreground">
              ({count})
            </span>
          ) : null}
        </span>
      ) : null}
    </span>
  );
}
