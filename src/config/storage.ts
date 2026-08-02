/**
 * Storage buckets — PRD §7.
 *
 * All public-read except `brochures`, which is private and served through a
 * 60-second signed URL after a lead is captured (`/api/brochure`).
 */
export const UPLOAD_BUCKETS = [
  "colleges",
  "banners",
  "gallery",
  "blogs",
  "testimonials",
  "press",
] as const;

export type UploadBucket = (typeof UPLOAD_BUCKETS)[number];

/** 5 MB. Bigger than any web image needs and small enough to fail fast on 3G. */
export const MAX_UPLOAD_BYTES = 5 * 1024 * 1024;

/**
 * Allowed image types, checked against the file's own MIME type rather than
 * its extension — an extension is trivially renamed.
 *
 * SVG is deliberately absent. `next/image` refuses remote SVG unless
 * `dangerouslyAllowSVG` is set, and an SVG can carry script — accepting one
 * from any staff account to turn that flag on is not a trade worth making.
 * Raster formats cover every real use here.
 */
export const ALLOWED_IMAGE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/avif",
] as const;

export function isUploadBucket(value: string): value is UploadBucket {
  return (UPLOAD_BUCKETS as readonly string[]).includes(value);
}
