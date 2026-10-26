-- CareerOptics — wire the website to the CRM (0027).
--
-- 1. Website enquiries flow into the CRM pipeline automatically.
-- 2. New auth users no longer become website staff by default.

-- ─────────────────────────────────────────────────────────────
-- 1. public.leads → crm.leads
-- ─────────────────────────────────────────────────────────────
-- Website sources (home_hero, college_finder, …) are not in crm.leads.source's
-- CHECK, so the row lands as source = 'website' and the page-level source is
-- kept in metadata. The course is matched to the CRM's course list by name.
-- A failure here must never fail the website's form, so it only warns.
create or replace function public.push_lead_to_crm()
returns trigger
language plpgsql
security definer
set search_path = crm, public, extensions
as $$
declare
  v_course uuid;
begin
  if NEW.course_id is not null then
    select cc.id into v_course
    from crm.courses cc
    join public.courses pc on pc.name = cc.name
    where pc.id = NEW.course_id
    limit 1;
  end if;

  insert into crm.leads (full_name, phone, email, city, course_id, source, status, metadata)
  values (
    coalesce(nullif(trim(NEW.name), ''), 'Website Enquiry'),
    right(regexp_replace(coalesce(NEW.phone, ''), '[^0-9]', '', 'g'), 10),
    nullif(trim(NEW.email), ''),
    nullif(trim(NEW.city), ''),
    v_course,
    'website',
    'new',
    jsonb_strip_nulls(jsonb_build_object(
      'website_lead_id', NEW.id,
      'website_source',  NEW.source,
      'page_url',        NEW.page_url,
      'level',           NEW.level,
      'message',         NEW.message,
      'utm_source',      NEW.utm_source,
      'utm_medium',      NEW.utm_medium,
      'utm_campaign',    NEW.utm_campaign,
      'answers',         NEW.answers
    ))
  );
  return NEW;
exception when others then
  raise warning 'push_lead_to_crm failed: %', sqlerrm;
  return NEW;
end;
$$;

drop trigger if exists on_lead_push_to_crm on public.leads;
create trigger on_lead_push_to_crm
  after insert on public.leads
  for each row execute function public.push_lead_to_crm();

-- ─────────────────────────────────────────────────────────────
-- 2. Website staff is opt-in
-- ─────────────────────────────────────────────────────────────
-- Students, associates and CRM staff all get auth.users rows now. Before this,
-- every one of them got an *active* public.profiles row — i.e. website staff
-- with read access to every enquiry. A super admin now activates website
-- staff explicitly.
alter table public.profiles alter column is_active set default false;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, is_active)
  values (new.id, coalesce(new.raw_user_meta_data->>'full_name', new.email), false)
  on conflict (id) do nothing;
  return new;
end;
$$;
