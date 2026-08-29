-- CareerOptics — private bucket for applicant marksheets.
--
-- The D.El.Ed / B.Ed application on the home page lets a student attach their
-- 10th, 12th and graduation marksheets. A marksheet carries a full name, a
-- father's name, a date of birth and a school or university — strictly more
-- identifying than the passport photo that 0005 already refused to make
-- public.
--
-- So the same shape as `applicant-photos`: private, and deliberately WITHOUT
-- any anon or authenticated policy. Uploads go through /api/upload/document
-- and reads through a short-lived signed URL in the admin, both with the
-- service role. No policy means no direct access for anyone else — that is the
-- intended state, not an omission.
--
-- Separate from `applicant-photos` rather than widening it: that bucket's
-- allowed_mime_types is images-only and a marksheet is as often a PDF scan, and
-- a bucket named for photographs should not quietly hold identity documents.
--
-- 8 MB rather than 0005's 5 MB — this has to accept whatever a phone camera
-- produces of an A4 sheet. Matches MAX_DOCUMENT_BYTES in config/storage.ts.
--
-- This bucket was created through the Storage API on the live project; the
-- statement is kept here so a fresh environment reproduces it.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'applicant-documents',
  'applicant-documents',
  false,
  8388608, -- 8 MB, matching MAX_DOCUMENT_BYTES
  array[
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/avif',
    'application/pdf'
  ]
)
on conflict (id) do update
  set public             = excluded.public,
      file_size_limit    = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;
