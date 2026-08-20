-- Lead capture forms: public-facing Meta/Facebook ad landing pages.

create table if not exists crm.lead_capture_forms (
  id                uuid primary key default gen_random_uuid(),
  slug              text unique not null,
  title             text not null,
  subtitle          text,
  fields            jsonb not null default '[]'::jsonb,
  success_message   text default 'Thank you! Our team will contact you shortly.',
  source            text not null default 'meta_ads',
  is_active         boolean not null default true,
  submissions_count integer not null default 0,
  created_by        uuid references public.profiles(id) on delete set null,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

create index if not exists lead_capture_forms_slug_idx on crm.lead_capture_forms (slug);

alter table crm.lead_capture_forms enable row level security;

create policy "public read active forms" on crm.lead_capture_forms for select
  using (is_active = true);

create policy "admin manage forms" on crm.lead_capture_forms for all
  using (crm.is_manager())
  with check (crm.is_manager());

create or replace function public.set_lcf_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end;
$$;

drop trigger if exists lcf_updated_at on crm.lead_capture_forms;
create trigger lcf_updated_at
  before update on crm.lead_capture_forms
  for each row execute function public.set_lcf_updated_at();
