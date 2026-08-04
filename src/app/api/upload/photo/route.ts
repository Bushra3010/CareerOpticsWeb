import { NextResponse, type NextRequest } from "next/server";

import { ALLOWED_IMAGE_TYPES, MAX_UPLOAD_BYTES } from "@/config/storage";
import { limitUploads } from "@/lib/rate-limit";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * POST /api/upload/photo — the applicant photograph on the §5.3 Apply form.
 *
 * Unlike /api/admin/upload this is open to the public, so nothing here can
 * lean on a staff check:
 *
 *  - rate limited per IP on its own budget, so it cannot be used to fill
 *    storage or to exhaust the lead limiter
 *  - the type is sniffed from the file's leading bytes, not its MIME header or
 *    extension, both of which the client controls
 *  - SVG is impossible by construction: it has no raster magic number
 *  - the destination bucket is hard-coded and private; the response returns a
 *    storage path, never a public URL, because there is no public URL to give
 *  - the stored filename is generated, so a caller cannot choose a path or
 *    overwrite an existing object
 */
export const runtime = "nodejs";

const BUCKET = "applicant-photos";

/** Leading bytes → real image type. */
const MAGIC: { type: string; ext: string; test: (b: Uint8Array) => boolean }[] = [
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

function clientIp(request: NextRequest): string {
  const forwarded = request.headers.get("x-forwarded-for");
  return forwarded?.split(",")[0]?.trim() || "unknown";
}

export async function POST(request: NextRequest) {
  const limit = await limitUploads(clientIp(request));
  if (!limit.success) {
    return NextResponse.json(
      { ok: false, error: "Too many uploads. Try again in a few minutes." },
      { status: 429, headers: { "retry-after": String(limit.retryAfter) } },
    );
  }

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid upload." }, { status: 400 });
  }

  const file = form.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ ok: false, error: "No file received." }, { status: 400 });
  }
  if (file.size === 0) {
    return NextResponse.json({ ok: false, error: "That file is empty." }, { status: 400 });
  }
  if (file.size > MAX_UPLOAD_BYTES) {
    return NextResponse.json(
      {
        ok: false,
        error: `Photo must be under ${MAX_UPLOAD_BYTES / 1024 / 1024} MB.`,
      },
      { status: 413 },
    );
  }

  const bytes = new Uint8Array(await file.arrayBuffer());
  const detected = MAGIC.find((candidate) => candidate.test(bytes));

  // The declared type must be allowed AND match what the bytes actually are, so
  // a renamed file or a spoofed content-type cannot get through.
  if (
    !detected ||
    !ALLOWED_IMAGE_TYPES.includes(
      detected.type as (typeof ALLOWED_IMAGE_TYPES)[number],
    )
  ) {
    return NextResponse.json(
      { ok: false, error: "Upload a JPG, PNG, WebP or AVIF photo." },
      { status: 415 },
    );
  }

  const path = `${new Date().getFullYear()}/${crypto.randomUUID()}.${detected.ext}`;

  const supabase = createAdminClient();
  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(path, bytes, { contentType: detected.type, upsert: false });

  if (error) {
    console.error(`[photo] ${BUCKET}/${path}: ${error.message}`);
    return NextResponse.json(
      { ok: false, error: "Upload failed. Try again." },
      { status: 500 },
    );
  }

  // A path, not a URL. The bucket is private; the admin mints a signed URL when
  // a counsellor opens the lead.
  return NextResponse.json({ ok: true, path });
}
