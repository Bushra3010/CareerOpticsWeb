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

/**
 * Applicant documents (marksheets) on the §5.3 Apply form. PDF joins the
 * raster types because a marksheet is as often a scan as a phone photo.
 */
export const ALLOWED_DOCUMENT_TYPES = [
  ...ALLOWED_IMAGE_TYPES,
  "application/pdf",
] as const;

/**
 * 8 MB — larger than `MAX_UPLOAD_BYTES` on purpose. That limit sizes web
 * images we control; this one has to swallow whatever a student's phone camera
 * produces of an A4 marksheet, and a rejected upload here costs an application.
 */
export const MAX_DOCUMENT_BYTES = 8 * 1024 * 1024;

/** Private bucket holding applicant marksheets — see migration 0026. */
export const DOCUMENT_BUCKET = "applicant-documents";

export function isUploadBucket(value: string): value is UploadBucket {
  return (UPLOAD_BUCKETS as readonly string[]).includes(value);
}
