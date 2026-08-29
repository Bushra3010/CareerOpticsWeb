import { NextResponse, type NextRequest } from "next/server";

import {
  ALLOWED_DOCUMENT_TYPES,
  DOCUMENT_BUCKET,
  MAX_DOCUMENT_BYTES,
} from "@/config/storage";
import { limitUploads } from "@/lib/rate-limit";
import { createAdminClient } from "@/lib/supabase/admin";
import { clientIp, IMAGE_MAGIC, PDF_MAGIC, storagePath } from "@/lib/upload";

/**
 * POST /api/upload/document — applicant marksheets on the §5.3 Apply form.
 *
 * The second public upload endpoint, and it carries more than the photo one
 * does: a marksheet shows a full name, a parent's name, a date of birth and a
 * school. So the bucket is private with no anon or authenticated policy at
 * all, exactly like `applicant-photos`, and the response is a storage path
 * because there is no public URL to give.
 *
 * It shares `limitUploads` with the photo endpoint deliberately — one budget
 * covers every file a single visitor can push, and three marksheets plus a
 * photo still sit inside it.
 */
export const runtime = "nodejs";

const ACCEPTED = [...IMAGE_MAGIC, PDF_MAGIC];

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
  if (file.size > MAX_DOCUMENT_BYTES) {
    return NextResponse.json(
      {
        ok: false,
        error: `File must be under ${MAX_DOCUMENT_BYTES / 1024 / 1024} MB.`,
      },
      { status: 413 },
    );
  }

  const bytes = new Uint8Array(await file.arrayBuffer());
  const detected = ACCEPTED.find((candidate) => candidate.test(bytes));

  if (
    !detected ||
    !ALLOWED_DOCUMENT_TYPES.includes(
      detected.type as (typeof ALLOWED_DOCUMENT_TYPES)[number],
    )
  ) {
    return NextResponse.json(
      { ok: false, error: "Upload a PDF, JPG, PNG, WebP or AVIF file." },
      { status: 415 },
    );
  }

  const path = storagePath(detected.ext);

  const supabase = createAdminClient();
  const { error } = await supabase.storage
    .from(DOCUMENT_BUCKET)
    .upload(path, bytes, { contentType: detected.type, upsert: false });

  if (error) {
    console.error(`[document] ${DOCUMENT_BUCKET}/${path}: ${error.message}`);
    return NextResponse.json(
      { ok: false, error: "Upload failed. Try again." },
      { status: 500 },
    );
  }

  return NextResponse.json({ ok: true, path });
}
