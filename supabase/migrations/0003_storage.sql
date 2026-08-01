-- CareerOptics — storage buckets (PRD §7)
-- Public read, service-role write. `brochures` is private: it is served through
-- a 60s signed URL from /api/brochure after a lead is captured (PRD §8).

insert into storage.buckets (id, name, public)
values
  ('colleges',     'colleges',     true),
  ('banners',      'banners',      true),
  ('gallery',      'gallery',      true),
  ('blogs',        'blogs',        true),
  ('testimonials', 'testimonials', true),
  ('press',        'press',        true),
  ('brochures',    'brochures',    false)
on conflict (id) do nothing;

-- Anyone may read objects in the public buckets.
create policy "public read public buckets"
  on storage.objects for select to anon, authenticated
  using (bucket_id in ('colleges','banners','gallery','blogs','testimonials','press'));

-- Staff (admin UI) may upload/replace/delete in every bucket.
create policy "staff write buckets"
  on storage.objects for insert to authenticated
  with check (
    bucket_id in ('colleges','banners','gallery','blogs','testimonials','press','brochures')
    and public.is_staff()
  );

create policy "staff update buckets"
  on storage.objects for update to authenticated
  using (public.is_staff()) with check (public.is_staff());

create policy "staff delete buckets"
  on storage.objects for delete to authenticated
  using (public.is_staff());

-- No anon policy on `brochures` — reads there require a signed URL.
