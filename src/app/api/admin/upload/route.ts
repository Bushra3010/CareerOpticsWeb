import { NextResponse, type NextRequest } from "next/server";

import {
  ALLOWED_IMAGE_TYPES,
  MAX_UPLOAD_BYTES,
  isUploadBucket,
} from "@/config/storage";
import { can, getStaffProfile } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Magic-byte sniffing for common image formats.
 * MIME headers and file extensions can be spoofed; the leading bytes
 * cannot, so we check the file's actual content before touching storage.
 *
 * References: JPEG FF D8 FF, PNG 89 50 4E 47, WebP RIFF....WEBP,
 *             AVIF 00 00 00 ?? 66 74 79 70 61 76 69 66
 */
function sniffType(buffer: ArrayBuffer): string | null {
  const u = new Uint8Array(buffer);
  // JPEG: FF D8 FF
  if (u[0] === 0xff && u[1] === 0xd8 && u[2] === 0xff) return "image/jpeg";
  // PNG: 89 50 4E 47 0D 0A 1A 0A
  if (
    u[0] === 0x89 &&
    u[1] === 0x50 &&
    u[2] === 0x4e &&
    u[3] === 0x47 &&
    u[4] === 0x0d &&
    u[5] === 0x0a &&
    u[6] === 0x1a &&
    u[7] === 0x0a
  )
    return "image/png";
  // WebP: RIFF .... WEBP
  if (
    u[0] === 0x52 &&
    u[1] === 0x49 &&
    u[2] === 0x46 &&
    u[3] === 0x46 &&
    u[8] === 0x57 &&
    u[9] === 0x45 &&
    u[10] === 0x42 &&
    u[11] === 0x50
  )
    return "image/webp";
  // AVIF: 00 00 00 ?? 66 74 79 70 61 76 69 66 (ftyp box, brand "avif")
  if (
    u[4] === 0x66 &&
    u[5] === 0x74 &&
    u[6] === 0x79 &&
    u[7] === 0x70 &&
    u[8] === 0x61 &&
    u[9] === 0x76 &&
    u[10] === 0x69 &&
    u[11] === 0x66
  )
    return "image/avif";
  return null;
}

/**
 * POST /api/admin/upload — image upload for the admin CRUD forms (§5.5).
 *
 * The service role is required because §7 gives the storage buckets
 * service-role-only write, so this route is the only write path. That makes
 * the staff check here load-bearing rather than cosmetic — unlike the database
 * routes, there is no RLS behind it to catch a mistake.
 */
export async function POST(request: NextRequest) {
  const profile = await getStaffProfile();
  if (!profile || !can(profile.role, "content")) {
    return NextResponse.json({ ok: false, error: "Not authorised." }, { status: 403 });
  }

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid upload." }, { status: 400 });
  }

  const file = form.get("file");
  const bucket = String(form.get("bucket") ?? "");

  if (!(file instanceof File)) {
    return NextResponse.json({ ok: false, error: "No file received." }, { status: 400 });
  }
  // Bucket comes from an allowlist, never straight from the request — a caller
  // must not be able to write into `brochures`, which is private.
  if (!isUploadBucket(bucket)) {
    return NextResponse.json({ ok: false, error: "Unknown bucket." }, { status: 400 });
  }

  // MIME headers and extensions can be spoofed; sniff the actual file content.
  const arrayBuffer = await file.arrayBuffer();
  const detected = sniffType(arrayBuffer);
  if (!detected || !ALLOWED_IMAGE_TYPES.includes(detected as (typeof ALLOWED_IMAGE_TYPES)[number])) {
    return NextResponse.json(
      { ok: false, error: "Use a JPG, PNG, WebP or AVIF image." },
      { status: 415 },
    );
  }
  if (file.size > MAX_UPLOAD_BYTES) {
    return NextResponse.json(
      { ok: false, error: `Image must be under ${MAX_UPLOAD_BYTES / 1024 / 1024} MB.` },
      { status: 413 },
    );
  }

  // Never trust the client's filename in a storage path. Keep a readable stem
  // for the dashboard, strip everything else, and prefix a random id so two
  // uploads of "logo.png" cannot overwrite each other.
  const extension = file.name.includes(".")
    ? file.name.split(".").pop()!.toLowerCase().replace(/[^a-z0-9]/g, "")
    : "bin";
  const stem = file.name
    .replace(/\.[^.]*$/, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 40) || "image";
  const path = `${crypto.randomUUID().slice(0, 8)}-${stem}.${extension}`;

  const supabase = createAdminClient();
  const { error } = await supabase.storage
    .from(bucket)
    .upload(path, file, { contentType: detected, upsert: false });

  if (error) {
    console.error(`[upload] ${bucket}/${path}: ${error.message}`);
    return NextResponse.json(
      { ok: false, error: "Upload failed. Try again." },
      { status: 500 },
    );
  }

  const { data } = supabase.storage.from(bucket).getPublicUrl(path);

  return NextResponse.json({ ok: true, url: data.publicUrl, path, bucket });
}
