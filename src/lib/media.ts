/**
 * Image helpers for DB-supplied URLs.
 *
 * `seed.sql` stores `/seed/...` paths for artwork that was never uploaded, so
 * those rows would render as broken images. `imageSrc` maps them to `null` and
 * every section falls back to a branded placeholder instead. Once real files
 * land in Supabase Storage the same field renders normally with no code change.
 */
export function imageSrc(url: string | null | undefined): string | null {
  if (!url) return null;
  if (url.startsWith("/seed/")) return null;
  return url;
}

/** Initials used by the placeholder tiles, e.g. "IIT Patna" → "IP". */
export function initials(name: string, max = 2): string {
  return name
    .split(/\s+/)
    .filter((word) => /[A-Za-z0-9]/.test(word[0] ?? ""))
    .slice(0, max)
    .map((word) => word[0]!.toUpperCase())
    .join("");
}

/** `12,50,000` → `₹12.5 L`. Packages and fees are stored in rupees. */
export function formatInr(amount: number | null | undefined): string | null {
  if (amount == null || amount <= 0) return null;
  if (amount >= 10_000_000) return `₹${(amount / 10_000_000).toFixed(2)} Cr`;
  if (amount >= 100_000) return `₹${(amount / 100_000).toFixed(1)} L`;
  return `₹${amount.toLocaleString("en-IN")}`;
}
