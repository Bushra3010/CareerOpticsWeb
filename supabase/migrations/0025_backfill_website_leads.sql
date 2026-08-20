-- Backfill: website leads captured before the CRM existed.
--
-- `public.push_lead_to_crm()` is an AFTER INSERT trigger, so it only ever fires
-- on new rows. Every lead the site collected before 0008 was applied stayed in
-- `public.leads` and never reached the pipeline — a counsellor opening the CRM
-- would see an empty board while the website had real enquiries sitting in it.
--
-- This mirrors the trigger's mapping exactly, so a backfilled lead is
-- indistinguishable from one the trigger wrote. `website_lead_id` is unique and
-- the conflict is ignored, which makes this safe to run as often as you like.

insert into crm.leads (
  full_name, phone, email, city, status, source,
  metadata, website_lead_id, created_at
)
select
  l.name,
  l.phone,
  nullif(l.email, ''),
  nullif(l.city, ''),
  'new',
  'website',
  jsonb_strip_nulls(jsonb_build_object(
    'website_source', l.source,
    'page_url',       l.page_url,
    'level',          l.level,
    'message',        l.message,
    'utm_source',     l.utm_source,
    'utm_medium',     l.utm_medium,
    'utm_campaign',   l.utm_campaign,
    'utm_content',    l.utm_content,
    'answers',        l.answers
  )),
  l.id,
  l.created_at
from public.leads l
order by l.created_at
on conflict (website_lead_id) do nothing;
