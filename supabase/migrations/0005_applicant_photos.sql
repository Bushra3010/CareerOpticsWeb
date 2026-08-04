-- CareerOptics — private bucket for applicant photographs.
--
-- The §5.3 Apply form mirrors the counsellors' paper admission form, which has
-- an "Affix recent Passport Size Photograph" box. Every bucket in 0003 except
-- `brochures` is public-read, and a student's photograph sitting next to the
-- name, date of birth, address and category that form already collects must
-- never be world-readable.
--
-- So: private, and deliberately WITHOUT any anon or authenticated policy.
-- Uploads go through /api/upload/photo and reads through a short-lived signed
-- URL in the admin, both with the service role. No policy means no direct
-- access for anyone else — that is the intended state, not an omission.
--
-- This bucket was created through the Storage API on the live project; the
-- statement is kept here so a fresh environment reproduces it.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'applicant-photos',
  'applicant-photos',
  false,
  5242880, -- 5 MB, matching MAX_UPLOAD_BYTES
  array['image/jpeg', 'image/png', 'image/webp', 'image/avif']
)
on conflict (id) do update
  set public             = excluded.public,
      file_size_limit    = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;
