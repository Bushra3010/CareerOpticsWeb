import { initials } from "@/lib/media";
import { cn } from "@/lib/utils";

/**
 * Branded stand-in for a college cover photo.
 *
 * Most colleges have no campus photo yet — the institution has to supply one,
 * and a wrong or unlicensed photo is worse than none. This keeps those cards
 * looking deliberate instead of empty, and disappears the moment a real
 * `cover_url` lands.
 *
 * Variants stay inside the blue family on purpose: §6.1 caps red at ~10% of a
 * viewport and reserves orange for goal/city text and urgency pills, so a grid
 * of 24 cards cannot rotate through those without breaking both rules.
 */
const VARIANTS = [
  "from-brand-blue-900 to-brand-blue",
  "from-brand-blue to-brand-blue-400",
  "from-brand-blue-900 to-brand-blue-400",
  "from-brand-blue-400 to-brand-blue",
] as const;

/** Stable per college, so a card keeps the same look across pages and reloads. */
function variantFor(seed: string) {
  let hash = 0;
  for (let i = 0; i < seed.length; i += 1) hash = (hash * 31 + seed.charCodeAt(i)) | 0;
  return VARIANTS[Math.abs(hash) % VARIANTS.length]!;
}

export function CoverPlate({
  name,
  seed,
  className,
}: {
  name: string;
  /** Usually the slug — anything stable per college. */
  seed: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex h-full w-full items-center justify-center bg-gradient-to-br",
        variantFor(seed),
        className,
      )}
      aria-hidden
    >
      <span className="font-display text-3xl font-extrabold tracking-wide text-white/90">
        {initials(name, 3)}
      </span>
    </div>
  );
}
