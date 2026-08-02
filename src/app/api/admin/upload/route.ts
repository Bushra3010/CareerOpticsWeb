import { NextResponse, type NextRequest } from "next/server";

import {
  ALLOWED_IMAGE_TYPES,
  MAX_UPLOAD_BYTES,
  isUploadBucket,
} from "@/config/storage";
import { can, getStaffProfile } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";

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
  if (!ALLOWED_IMAGE_TYPES.includes(file.type as (typeof ALLOWED_IMAGE_TYPES)[number])) {
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
    .upload(path, file, { contentType: file.type, upsert: false });

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
