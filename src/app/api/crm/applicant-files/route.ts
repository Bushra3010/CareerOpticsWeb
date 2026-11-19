import { NextResponse, type NextRequest } from 'next/server'

import { ALLOWED_DOCUMENT_TYPES, DOCUMENT_BUCKET, MAX_DOCUMENT_BYTES } from '@/config/storage'
import { requireCrmStaff } from '@/crm/lib/api-auth'
import { createAdminClient } from '@/lib/supabase/admin'
import { IMAGE_MAGIC, PDF_MAGIC, storagePath } from '@/lib/upload'

/**
 * Admission documents (photo, marksheets, Aadhaar…) for CRM staff.
 *
 * They live in the website's PRIVATE buckets — `applicant-photos` for the
 * passport photo, `applicant-documents` for everything else — so a student's
 * identity documents are never world-readable. Staff upload through POST and
 * open a file through GET, which mints a 5-minute signed URL.
 */
export const runtime = 'nodejs'

const PHOTO_BUCKET = 'applicant-photos'
const PATH_RE = /^[a-z0-9/_-]+\.(jpg|jpeg|png|webp|avif|pdf)$/i

export async function GET(request: NextRequest) {
  const caller = await requireCrmStaff()
  if (caller instanceof NextResponse) return caller

  const path = request.nextUrl.searchParams.get('path') ?? ''
  const kind = request.nextUrl.searchParams.get('kind')
  if (!PATH_RE.test(path) || path.includes('..')) {
    return NextResponse.json({ error: 'Invalid path' }, { status: 400 })
  }
  const bucket = kind === 'photo' ? PHOTO_BUCKET : DOCUMENT_BUCKET
  const { data, error } = await createAdminClient().storage.from(bucket).createSignedUrl(path, 300)
  if (error || !data) return NextResponse.json({ error: 'File not found' }, { status: 404 })
  return NextResponse.redirect(data.signedUrl)
}

export async function POST(request: NextRequest) {
  const caller = await requireCrmStaff()
  if (caller instanceof NextResponse) return caller

  let form: FormData
  try {
    form = await request.formData()
  } catch {
    return NextResponse.json({ error: 'Invalid upload' }, { status: 400 })
  }
  const file = form.get('file')
  const kind = form.get('kind') === 'photo' ? 'photo' : 'document'
  if (!(file instanceof File) || file.size === 0) {
    return NextResponse.json({ error: 'No file received' }, { status: 400 })
  }
  if (file.size > MAX_DOCUMENT_BYTES) {
    return NextResponse.json({ error: `File must be under ${MAX_DOCUMENT_BYTES / 1024 / 1024} MB` }, { status: 413 })
  }

  const bytes = new Uint8Array(await file.arrayBuffer())
  const accepted = kind === 'photo' ? IMAGE_MAGIC : [...IMAGE_MAGIC, PDF_MAGIC]
  const detected = accepted.find((c) => c.test(bytes))
  if (!detected || (kind === 'document' && !ALLOWED_DOCUMENT_TYPES.includes(detected.type as never))) {
    return NextResponse.json(
      { error: kind === 'photo' ? 'Upload a JPG, PNG or WebP photo' : 'Upload a PDF, JPG, PNG or WebP file' },
      { status: 415 },
    )
  }

  const path = storagePath(detected.ext)
  const bucket = kind === 'photo' ? PHOTO_BUCKET : DOCUMENT_BUCKET
  const { error } = await createAdminClient()
    .storage.from(bucket)
    .upload(path, bytes, { contentType: detected.type, upsert: false })
  if (error) {
    console.error(`[crm applicant-files] ${bucket}/${path}: ${error.message}`)
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 })
  }
  return NextResponse.json({ path })
}
