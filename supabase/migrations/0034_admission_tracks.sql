-- 0034 — admission form links for every track.
--
-- 0031 made admission links B.Ed / D.El.Ed only. Links now carry the track
-- (Student Credit Card, B.Ed / D.El.Ed, Distance, NIOS / BBOSE) and any of
-- their programme codes; /apply/[code] renders that track's form. The bridge
-- takes the CRM category from answers.track, and fills crm.leads.state from
-- the form's address.

alter table crm.admission_links
  add column if not exists track text not null default 'teacher_training';
alter table crm.admission_links drop constraint if exists admission_links_track_check;
alter table crm.admission_links add constraint admission_links_track_check
  check (track in ('credit_card', 'teacher_training', 'distance', 'open_school'));

alter table crm.admission_links drop constraint if exists admission_links_programme_check;
alter table crm.admission_links add constraint admission_links_programme_check
  check (programme in ('B.Ed', 'D.El.Ed', 'BSCC', 'Distance', 'NIOS', 'BBOSE'));

create index if not exists idx_admission_links_track on crm.admission_links(track, created_at desc);

-- Website → CRM bridge, now with the track's category.
create or replace function public.push_lead_to_crm()
returns trigger
language plpgsql
security definer
set search_path = crm, public, extensions
as $$
declare
  v_course   uuid;
  v_category text;
  v_assignee uuid;
  v_ref      text := NEW.answers->>'ref';
begin
  if NEW.course_id is not null then
    select cc.id into v_course
    from crm.courses cc
    join public.courses pc on pc.name = cc.name
    where pc.id = NEW.course_id
    limit 1;
  end if;

  -- Track forms (0034) say which business line they belong to.
  if NEW.answers->>'track' in ('credit_card', 'teacher_training', 'distance', 'open_school') then
    v_category := NEW.answers->>'track';
  elsif NEW.source = 'teaching_admission' then
    v_category := 'teacher_training';
  end if;

  -- Submitted through a counsellor's admission link: theirs to follow up.
  if v_ref is not null then
    update crm.admission_links
    set submissions = submissions + 1
    where code = v_ref and is_active
    returning created_by into v_assignee;
  end if;

  insert into crm.leads (full_name, phone, email, city, state, course_id, source, status,
                         category, assigned_to, assigned_at, metadata)
  values (
    coalesce(nullif(trim(NEW.name), ''), 'Website Enquiry'),
    right(regexp_replace(coalesce(NEW.phone, ''), '[^0-9]', '', 'g'), 10),
    nullif(trim(NEW.email), ''),
    nullif(trim(NEW.city), ''),
    nullif(trim(NEW.answers->>'address_state'), ''),
    v_course,
    'website',
    'new',
    v_category,
    v_assignee,
    case when v_assignee is not null then now() end,
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

  if v_assignee is not null then
    insert into crm.notifications (title, message, type, target_user_id)
    values (
      'New admission form',
      coalesce(NEW.answers->>'programme', 'Admission') || ' form submitted by ' ||
        coalesce(nullif(trim(NEW.name), ''), 'a student') || ' through your link',
      'success',
      v_assignee
    );
  end if;
  return NEW;
exception when others then
  raise warning 'push_lead_to_crm failed: %', sqlerrm;
  return NEW;
end;
$$;
