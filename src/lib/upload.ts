import type { NextRequest } from "next/server";

/**
 * Shared hardening for the two public upload endpoints (`/api/upload/photo`
 * and `/api/upload/document`).
 *
 * Neither has a staff check to lean on, so the type of an uploaded file is
 * decided by its leading bytes — never by the extension or the content-type
 * header, both of which the client controls. SVG is impossible by
 * construction: it has no magic number, so it matches nothing below.
 */

export type FileKind = { type: string; ext: string; test: (b: Uint8Array) => boolean };

export const IMAGE_MAGIC: FileKind[] = [
  {
    type: "image/jpeg",
    ext: "jpg",
    test: (b) => b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff,
  },
  {
    type: "image/png",
    ext: "png",
    test: (b) =>
      b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47,
  },
  {
    type: "image/webp",
    ext: "webp",
    test: (b) =>
      b[0] === 0x52 &&
      b[1] === 0x49 &&
      b[2] === 0x46 &&
      b[3] === 0x46 &&
      b[8] === 0x57 &&
      b[9] === 0x45 &&
      b[10] === 0x42 &&
      b[11] === 0x50,
  },
  {
    type: "image/avif",
    ext: "avif",
    test: (b) =>
      b[4] === 0x66 &&
      b[5] === 0x74 &&
      b[6] === 0x79 &&
      b[7] === 0x70 &&
      b[8] === 0x61 &&
      b[9] === 0x76 &&
      b[10] === 0x69 &&
      b[11] === 0x66,
  },
];

/**
 * `%PDF-`. A marksheet is as often a scan as a photo, so the document endpoint
 * accepts PDF on top of the raster types — but still by signature, so a script
 * renamed to `.pdf` is refused exactly like a renamed SVG is.
 */
export const PDF_MAGIC: FileKind = {
  type: "application/pdf",
  ext: "pdf",
  test: (b) =>
    b[0] === 0x25 && b[1] === 0x50 && b[2] === 0x44 && b[3] === 0x46 && b[4] === 0x2d,
};

/** Accept only valid IPv4/IPv6 addresses — headers can contain anything. */
function asInet(value: string | null): string | null {
  if (!value) return null;
  const trimmed = value.split(",")[0]!.trim();
  if (!trimmed) return null;
  if (/^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(trimmed)) return trimmed;
  if (/^[0-9a-fA-F:]+$/.test(trimmed)) return trimmed;
  return null;
}

export function clientIp(request: NextRequest): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    const first = forwarded.split(",")[0]?.trim();
    if (first) return asInet(first) ?? "unknown";
    return "unknown";
  }
  const realIp = request.headers.get("x-real-ip");
  if (realIp) return asInet(realIp) ?? "unknown";
  return "unknown";
}

/**
 * Generated, never client-supplied: a caller cannot choose a path, collide
 * with an existing object or escape the year prefix.
 */
export function storagePath(ext: string): string {
  return `${new Date().getFullYear()}/${crypto.randomUUID()}.${ext}`;
}
