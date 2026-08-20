-- ─────────────────────────────────────────────────────────────────────────────
-- CRM — Phase 1: leads pipeline, students, fees and settings.
--
-- Ported from the DCW CRM (schema only, no data) into a dedicated `crm`
-- Postgres schema.
--
-- WHY A SEPARATE SCHEMA
-- The CRM and this website both have `leads`, `courses`, `profiles` and
-- `lead_activities`, and they are genuinely different tables:
--   • public.leads.name vs crm.leads.full_name
--   • public.leads.source is free text ('home_hero', 'college_finder', …);
--     the CRM constrains source to its own list and would REJECT those values
--   • public.courses is the 60-row SEO catalogue; crm.courses is the short
--     list of things the consultancy actually sells
-- Keeping the CRM in its own schema means none of that has to be reconciled
-- and the live website keeps working untouched.
--
-- ONE EXCEPTION: profiles. Staff should have one login and one role, so the
-- CRM reuses public.profiles and the `user_role` enum is extended rather than
-- creating a second user table.
--
-- Staff roles live in 0005_crm_roles.sql — it has to commit before the RLS
-- policies here can compare against the new enum values.
--
-- ⚠ After applying, add `crm` to Supabase → Project Settings → API →
--   "Exposed schemas", or PostgREST will not serve these tables.
-- ─────────────────────────────────────────────────────────────────────────────

create schema if not exists crm;
grant usage on schema crm to anon, authenticated, service_role;


-- ── Reference data ───────────────────────────────────────────────────────────

-- What the consultancy sells. Distinct from public.courses, which is the
-- public catalogue students browse.
create table if not exists crm.courses (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists crm.sub_courses (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references crm.courses(id) on delete cascade,
  name text not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

-- Admission session, e.g. "2026-27".
create table if not exists crm.sessions (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists crm.departments (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

-- University or board under a department.
create table if not exists crm.department_sub_sections (
  id uuid primary key default gen_random_uuid(),
  department_id uuid not null references crm.departments(id) on delete cascade,
  name text not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

-- ── Leads ────────────────────────────────────────────────────────────────────

create table if not exists crm.leads (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  phone text not null,
  email text,
  city text,
  state text,

  course_id uuid references crm.courses(id) on delete set null,
  sub_course_id uuid references crm.sub_courses(id) on delete set null,
  department_id uuid references crm.departments(id) on delete set null,
  sub_section_id uuid references crm.department_sub_sections(id) on delete set null,
  session_id uuid references crm.sessions(id) on delete set null,

  -- 'custom' carries a free-text label in custom_status.
  status text not null default 'new' check (status in (
    'new','contacted','interested','counselled','document_received',
    'converted','lost','dnp','switch_off','not_reachable',
    'not_interested','custom'
  )),
  custom_status text,

  -- `website` covers everything arriving from careeroptics.in. The bridge
  -- trigger records the page-level source in metadata.website_source.
  source text not null default 'website' check (source in (
    'website','walk_in','referral','whatsapp','phone','excel_import',
    'social_media','meta_ads','ivr','other'
  )),

  mode text check (mode in ('attending','non-attending')),
  assigned_to uuid references public.profiles(id) on delete set null,
  assigned_at timestamptz,
  next_followup_date date,

  total_fee numeric(12,2),
  amount_paid numeric(12,2) not null default 0,
  enrollment_date date,
  converted_at timestamptz,

  import_batch_id text,
  metadata jsonb not null default '{}'::jsonb,
  -- Set by trigger. Dedupes and matches IVR callbacks, which only ever carry
  -- the last ten digits.
  phone_last10 text,
  -- The public.leads row this came from, when it originated on the website.
  website_lead_id uuid references public.leads(id) on delete set null,

  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists crm_leads_status_idx on crm.leads (status);
create index if not exists crm_leads_assigned_idx on crm.leads (assigned_to);
create index if not exists crm_leads_created_idx on crm.leads (created_at desc);
create index if not exists crm_leads_phone10_idx on crm.leads (phone_last10);
create index if not exists crm_leads_followup_idx on crm.leads (next_followup_date);
-- Plain, not partial: ON CONFLICT cannot infer a partial index without
-- repeating its predicate, and Postgres already treats NULLs as distinct, so
-- any number of manually-created leads (website_lead_id null) coexist fine.
create unique index if not exists crm_leads_website_lead_idx
  on crm.leads (website_lead_id);

create table if not exists crm.lead_activities (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid not null references crm.leads(id) on delete cascade,
  activity_type text not null check (activity_type in (
    'created','status_changed','assigned','transferred','note_added',
    'followup_set','payment_received','converted','document_uploaded','call_made'
  )),
  old_value text,
  new_value text,
  note text,
  performed_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists crm_lead_activities_lead_idx
  on crm.lead_activities (lead_id, created_at desc);

-- ── Students ─────────────────────────────────────────────────────────────────

create table if not exists crm.students (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid unique references crm.leads(id) on delete set null,
  enrollment_number text not null unique,
  full_name text not null,
  phone text not null,
  email text,
  city text,

  father_name text,
  guardian_name text,
  guardian_phone text,
  guardian_relationship text,

  course_id uuid references crm.courses(id) on delete set null,
  sub_course_id uuid references crm.sub_courses(id) on delete set null,
  department_id uuid references crm.departments(id) on delete set null,
  sub_section_id uuid references crm.department_sub_sections(id) on delete set null,
  session_id uuid references crm.sessions(id) on delete set null,
  mode text check (mode in ('attending','non-attending')),

  assigned_counsellor uuid references public.profiles(id) on delete set null,
  mentor_telecaller_id uuid references public.profiles(id) on delete set null,

  total_fee numeric(12,2),
  amount_paid numeric(12,2) not null default 0,
  incentive_amount numeric(10,2) default 0,
  enrollment_date date,

  -- 'pending' is the landing state for a converted lead; an admin approves it
  -- into 'active' rather than a telecaller creating live students directly.
  status text not null default 'pending' check (status in (
    'pending','active','completed','dropped','on_hold'
  )),
  drop_reason text,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists crm_students_status_idx on crm.students (status);
create index if not exists crm_students_counsellor_idx on crm.students (assigned_counsellor);

-- ── Money ────────────────────────────────────────────────────────────────────

create table if not exists crm.payments (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid references crm.leads(id) on delete set null,
  student_id uuid references crm.students(id) on delete set null,
  amount numeric(12,2) not null check (amount > 0),
  payment_mode text not null check (payment_mode in (
    'cash','upi','card','neft','rtgs','cheque','other'
  )),
  payment_date date not null,
  receipt_number text,
  notes text,
  recorded_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists crm_payments_student_idx on crm.payments (student_id);
create index if not exists crm_payments_date_idx on crm.payments (payment_date desc);

create table if not exists crm.fee_structures (
  id uuid primary key default gen_random_uuid(),
  course_id uuid references crm.courses(id) on delete cascade,
  sub_course_id uuid references crm.sub_courses(id) on delete cascade,
  session_id uuid references crm.sessions(id) on delete set null,
  total_fee numeric(12,2) not null check (total_fee >= 0),
  registration_fee numeric(12,2) default 0,
  notes text,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

-- ── Work ─────────────────────────────────────────────────────────────────────

create table if not exists crm.tasks (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  assigned_to uuid references public.profiles(id) on delete cascade,
  assigned_by uuid references public.profiles(id) on delete set null,
  lead_id uuid references crm.leads(id) on delete cascade,
  student_id uuid references crm.students(id) on delete cascade,
  due_date date,
  priority text not null default 'normal' check (priority in ('low','normal','high','urgent')),
  status text not null default 'pending' check (status in ('pending','in_progress','done')),
  completed_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists crm_tasks_assignee_idx on crm.tasks (assigned_to, status);

-- ── Settings ─────────────────────────────────────────────────────────────────

-- Which fields the lead form shows, and in what order.
create table if not exists crm.lead_form_fields (
  id uuid primary key default gen_random_uuid(),
  field_key text not null unique,
  label text not null,
  field_type text not null default 'text' check (field_type in (
    'text','number','date','select','textarea','email','phone'
  )),
  is_required boolean not null default false,
  is_active boolean not null default true,
  -- System fields map to real columns and cannot be deleted, only hidden.
  is_system boolean not null default false,
  display_order int not null default 0,
  created_at timestamptz not null default now()
);

-- Per-user column choice on the leads table.
create table if not exists crm.lead_column_preferences (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  columns jsonb not null default '[]'::jsonb,
  updated_at timestamptz not null default now(),
  unique (user_id)
);

-- ── Triggers ─────────────────────────────────────────────────────────────────

create or replace function crm.touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create trigger crm_leads_touch before update on crm.leads
  for each row execute function crm.touch_updated_at();
create trigger crm_students_touch before update on crm.students
  for each row execute function crm.touch_updated_at();

-- Last ten digits, so a +91-prefixed number and a bare one match, and an IVR
-- callback (which only ever sends ten digits) finds its lead.
create or replace function crm.set_phone_last10()
returns trigger language plpgsql as $$
begin
  new.phone_last10 := right(regexp_replace(coalesce(new.phone, ''), '\D', '', 'g'), 10);
  return new;
end;
$$;

create trigger crm_leads_phone10 before insert or update of phone on crm.leads
  for each row execute function crm.set_phone_last10();

-- Enrollment numbers are sequential per calendar year: CO-2026-00001.
create sequence if not exists crm.enrollment_seq;

create or replace function crm.next_enrollment_number()
returns text language sql as $$
  select 'CO-' || to_char(now(), 'YYYY') || '-' ||
         lpad(nextval('crm.enrollment_seq')::text, 5, '0');
$$;

/**
 * A lead reaching 'converted' becomes a student.
 *
 * The student lands as 'pending' rather than 'active' — conversion is a
 * telecaller's claim, and an admin approves it before the student is real.
 * Idempotent: a lead flipped back and forth does not create duplicates.
 */
create or replace function crm.handle_lead_conversion()
returns trigger language plpgsql security definer set search_path = crm, public as $$
begin
  if new.status = 'converted' and coalesce(old.status, '') <> 'converted' then
    insert into crm.students (
      lead_id, enrollment_number, full_name, phone, email, city,
      course_id, sub_course_id, department_id, sub_section_id, session_id,
      mode, assigned_counsellor, total_fee, amount_paid, enrollment_date, status
    ) values (
      new.id, crm.next_enrollment_number(), new.full_name, new.phone, new.email, new.city,
      new.course_id, new.sub_course_id, new.department_id, new.sub_section_id, new.session_id,
      new.mode, new.assigned_to, new.total_fee, new.amount_paid,
      coalesce(new.enrollment_date, current_date), 'pending'
    )
    on conflict (lead_id) do nothing;

    new.converted_at := coalesce(new.converted_at, now());

    insert into crm.lead_activities (lead_id, activity_type, new_value, performed_by)
    values (new.id, 'converted', 'converted', auth.uid());
  end if;
  return new;
end;
$$;

create trigger crm_leads_conversion before update on crm.leads
  for each row execute function crm.handle_lead_conversion();

-- ── Bridge: website lead → CRM pipeline ──────────────────────────────────────

/**
 * Every lead the website captures becomes a CRM lead.
 *
 * The website's own `source` vocabulary ('home_hero', 'college_finder',
 * 'brochure', …) is not valid in crm.leads.source, so it is folded into
 * `website` and the original is kept in metadata.website_source. The finder's
 * six answers and the UTM set ride along in metadata too, so a telecaller sees
 * the whole funnel without joining back.
 *
 * SECURITY DEFINER because /api/leads writes as the service role and this must
 * work for an anonymous submission.
 */
create or replace function public.push_lead_to_crm()
returns trigger language plpgsql security definer set search_path = crm, public as $$
begin
  insert into crm.leads (
    full_name, phone, email, city, status, source,
    metadata, website_lead_id, created_at
  ) values (
    new.name,
    new.phone,
    nullif(new.email, ''),
    nullif(new.city, ''),
    'new',
    'website',
    jsonb_strip_nulls(jsonb_build_object(
      'website_source', new.source,
      'page_url',       new.page_url,
      'level',          new.level,
      'message',        new.message,
      'utm_source',     new.utm_source,
      'utm_medium',     new.utm_medium,
      'utm_campaign',   new.utm_campaign,
      'utm_content',    new.utm_content,
      'answers',        new.answers
    )),
    new.id,
    new.created_at
  )
  on conflict (website_lead_id) do nothing;

  return new;
end;
$$;

create trigger leads_push_to_crm after insert on public.leads
  for each row execute function public.push_lead_to_crm();

-- ── RLS ──────────────────────────────────────────────────────────────────────
-- Nothing in `crm` is public. Every table is staff-only, and a telecaller sees
-- only the leads and students they own — the same shape as the DCW CRM.

create or replace function crm.is_crm_staff()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.profiles p
     where p.id = auth.uid() and p.is_active
  );
$$;

create or replace function crm.is_manager()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.profiles p
     where p.id = auth.uid() and p.is_active
       and p.role in ('super_admin','backend','finance')
  );
$$;

do $$
declare t text;
begin
  foreach t in array array[
    'courses','sub_courses','sessions','departments','department_sub_sections',
    'leads','lead_activities','students','payments','fee_structures','tasks',
    'lead_form_fields','lead_column_preferences'
  ] loop
    execute format('alter table crm.%I enable row level security', t);
    execute format('grant select, insert, update, delete on crm.%I to authenticated', t);
  end loop;
end $$;

grant usage, select on all sequences in schema crm to authenticated;

-- Reference data: any staff member reads, managers write.
do $$
declare t text;
begin
  foreach t in array array[
    'courses','sub_courses','sessions','departments','department_sub_sections',
    'fee_structures','lead_form_fields'
  ] loop
    execute format(
      'create policy "staff read" on crm.%I for select to authenticated using (crm.is_crm_staff())', t);
    execute format(
      'create policy "manager write" on crm.%I for all to authenticated using (crm.is_manager()) with check (crm.is_manager())', t);
  end loop;
end $$;

-- Leads: managers see everything, a telecaller sees their own.
create policy "manager reads all leads" on crm.leads for select to authenticated
  using (crm.is_manager());
create policy "own leads" on crm.leads for select to authenticated
  using (assigned_to = auth.uid() or created_by = auth.uid());
create policy "staff create leads" on crm.leads for insert to authenticated
  with check (crm.is_crm_staff());
create policy "manager updates leads" on crm.leads for update to authenticated
  using (crm.is_manager()) with check (crm.is_manager());
create policy "own leads update" on crm.leads for update to authenticated
  using (assigned_to = auth.uid() or created_by = auth.uid())
  with check (assigned_to = auth.uid() or created_by = auth.uid());
create policy "manager deletes leads" on crm.leads for delete to authenticated
  using (crm.is_manager());

-- Activities follow the lead they belong to.
create policy "read activities" on crm.lead_activities for select to authenticated
  using (crm.is_crm_staff());
create policy "write activities" on crm.lead_activities for insert to authenticated
  with check (crm.is_crm_staff());

create policy "manager reads students" on crm.students for select to authenticated
  using (crm.is_manager());
create policy "own students" on crm.students for select to authenticated
  using (assigned_counsellor = auth.uid() or mentor_telecaller_id = auth.uid());
create policy "staff write students" on crm.students for insert to authenticated
  with check (crm.is_crm_staff());
create policy "manager updates students" on crm.students for update to authenticated
  using (crm.is_manager()) with check (crm.is_manager());
create policy "manager deletes students" on crm.students for delete to authenticated
  using (crm.is_manager());

-- Money is manager-only to read in bulk; a telecaller can still record one.
create policy "manager reads payments" on crm.payments for select to authenticated
  using (crm.is_manager());
create policy "own payments" on crm.payments for select to authenticated
  using (recorded_by = auth.uid());
create policy "staff record payment" on crm.payments for insert to authenticated
  with check (crm.is_crm_staff());
create policy "manager updates payments" on crm.payments for update to authenticated
  using (crm.is_manager()) with check (crm.is_manager());
create policy "manager deletes payments" on crm.payments for delete to authenticated
  using (crm.is_manager());

create policy "own tasks" on crm.tasks for select to authenticated
  using (crm.is_manager() or assigned_to = auth.uid() or assigned_by = auth.uid());
create policy "staff create tasks" on crm.tasks for insert to authenticated
  with check (crm.is_crm_staff());
create policy "own tasks update" on crm.tasks for update to authenticated
  using (crm.is_manager() or assigned_to = auth.uid() or assigned_by = auth.uid())
  with check (crm.is_crm_staff());
create policy "manager deletes tasks" on crm.tasks for delete to authenticated
  using (crm.is_manager());

create policy "own column prefs" on crm.lead_column_preferences for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

-- ── Seed: the field list the lead form starts from ───────────────────────────
insert into crm.lead_form_fields (field_key, label, field_type, is_required, is_system, display_order)
values
  ('full_name','Full name','text',true,true,10),
  ('phone','Phone','phone',true,true,20),
  ('email','Email','email',false,true,30),
  ('city','City','text',false,true,40),
  ('state','State','text',false,true,50),
  ('course_id','Course','select',false,true,60),
  ('sub_course_id','Sub course','select',false,true,70),
  ('session_id','Session','select',false,true,80),
  ('mode','Mode','select',false,true,100),
  ('department_id','Department','select',false,true,110),
  ('sub_section_id','University / Board','select',false,true,120),
  ('enrollment_date','Expected enrollment date','date',false,true,130),
  ('next_followup_date','Next follow-up','date',false,true,140),
  ('total_fee','Total fee','number',false,true,200),
  ('amount_paid','Amount paid','number',false,true,210)
on conflict (field_key) do nothing;
