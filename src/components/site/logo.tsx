import Link from "next/link";

import { cn } from "@/lib/utils";

/**
 * Wordmark: "Career" in brand blue, "Optics" in brand red — the logo the whole
 * palette is derived from (§6). `inverse` is for dark backgrounds, where the
 * red half would fail contrast, so it uses amber instead.
 */
export function Logo({
  inverse = false,
  className,
  href = "/",
}: {
  inverse?: boolean;
  className?: string;
  href?: string;
}) {
  return (
    <Link
      href={href}
      aria-label="CareerOptics — home"
      className={cn(
        "font-display text-h3 leading-none tracking-tight rounded-lg focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:outline-none",
        className,
      )}
    >
      <span className={inverse ? "text-white" : "text-brand-blue"}>Career</span>
      <span className={inverse ? "text-brand-amber" : "text-brand-red"}>
        Optics
      </span>
    </Link>
  );
}
