-- CareerOptics — initial schema (PRD §7)
-- Never edit this file after it has been applied; add a new numbered migration instead.

create extension if not exists "pgcrypto";
create extension if not exists "pg_trgm";

-- ─────────────────────────────────────────────────────────────
-- Enums
-- ─────────────────────────────────────────────────────────────
create type level_enum     as enum ('after_10','after_12','ug','pg','diploma','doctorate','certificate');
create type college_type   as enum ('private','government','deemed','autonomous','state','central');
create type lead_status    as enum ('new','contacted','interested','visit_scheduled','admitted','dropped','junk');
create type content_status as enum ('draft','published','archived');
create type user_role      as enum ('super_admin','editor','counsellor');

-- ─────────────────────────────────────────────────────────────
-- Shared trigger: keep updated_at fresh
-- ─────────────────────────────────────────────────────────────
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ─────────────────────────────────────────────────────────────
-- Geo
-- ─────────────────────────────────────────────────────────────
create table states (
  id   uuid primary key default gen_random_uuid(),
  name text not null,
  slug text unique not null
);

create table cities (
  id       uuid primary key default gen_random_uuid(),
  state_id uuid references states(id) on delete cascade,
  name     text not null,
  slug     text unique not null
);
create index cities_state_id_idx on cities (state_id);

-- ─────────────────────────────────────────────────────────────
-- Taxonomy
-- ─────────────────────────────────────────────────────────────
create table streams (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  slug        text unique not null,
  icon        text,
  description text,
  sort_order  int  default 0,
  is_featured bool default false
);

create table courses (
  id            uuid primary key default gen_random_uuid(),
  name          text not null,
  short_name    text,
  slug          text unique not null,
  stream_id     uuid references streams(id),
  level         level_enum not null,
  duration_months  int,
  eligibility   text,
  description   text,
  avg_fee_min   int,
  avg_fee_max   int,
  career_scope  text,
  is_featured   bool default false,
  status        content_status default 'published',
  meta_title    text,
  meta_description text,
  created_at    timestamptz default now()
);
create index courses_stream_id_idx on courses (stream_id);
create index courses_level_idx     on courses (level);
create index courses_status_idx    on courses (status, is_featured);
create index courses_name_trgm     on courses using gin (name gin_trgm_ops);

-- ─────────────────────────────────────────────────────────────
-- Colleges
-- ─────────────────────────────────────────────────────────────
create table colleges (
  id         uuid primary key default gen_random_uuid(),
  name       text not null,
  slug       text unique not null,
  short_name text,
  city_id    uuid references cities(id),
  address    text,
  type       college_type,
  established_year int,
  naac_grade text,
  nirf_rank  int,
  approvals  text[],                          -- {UGC,AICTE,NCTE,PCI,BCI,NBA,AIU}
  logo_url   text,
  cover_url  text,
  brochure_url text,
  highest_package bigint,
  average_package bigint,
  total_students  int,
  campus_size text,
  facilities  text[],
  about       text,
  admission_process text,
  why_choose  text,
  rating       numeric(2,1) default 0,
  review_count int          default 0,
  lat numeric,
  lng numeric,
  website text,
  is_featured bool default false,
  status      content_status default 'published',
  meta_title  text,
  meta_description text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
create index colleges_city_id_idx on colleges (city_id);
create index colleges_status_idx  on colleges (status, is_featured);
create index colleges_name_trgm   on colleges using gin (name gin_trgm_ops);

create trigger colleges_set_updated_at
  before update on colleges
  for each row execute function public.set_updated_at();

create table college_courses (
  id          uuid primary key default gen_random_uuid(),
  college_id  uuid references colleges(id) on delete cascade,
  course_id   uuid references courses(id)  on delete cascade,
  fee_per_year int,
  total_fee    int,
  duration_months int,
  seats        int,
  eligibility  text,
  unique (college_id, course_id)
);
create index college_courses_course_id_idx on college_courses (course_id);

create table college_gallery (
  id         uuid primary key default gen_random_uuid(),
  college_id uuid references colleges(id) on delete cascade,
  image_url  text,
  caption    text,
  sort_order int default 0
);
create index college_gallery_college_id_idx on college_gallery (college_id);

-- ─────────────────────────────────────────────────────────────
-- Exams
-- ─────────────────────────────────────────────────────────────
create table exams (
  id   uuid primary key default gen_random_uuid(),
  name text not null,
  slug text unique not null,
  conducting_body text,
  level level_enum,
  mode  text,
  exam_date         date,
  application_start date,
  application_end   date,
  eligibility  text,
  pattern      text,
  syllabus     text,
  official_url text,
  status       content_status default 'published',
  meta_title   text,
  meta_description text
);
create index exams_status_idx on exams (status);

create table exam_courses (
  exam_id   uuid references exams(id)   on delete cascade,
  course_id uuid references courses(id) on delete cascade,
  primary key (exam_id, course_id)
);

-- ─────────────────────────────────────────────────────────────
-- Lead engine
-- ─────────────────────────────────────────────────────────────
create table leads (
  id     uuid primary key default gen_random_uuid(),
  name   text not null,
  phone  text not null,
  email  text,
  city   text,
  country_code text default '+91',
  level      level_enum,
  course_id  uuid references courses(id),
  college_id uuid references colleges(id),
  message    text,
  -- home_hero | quick_enquiry | college_detail | college_finder | brochure | callback | contact | apply_now
  source   text not null,
  page_url text,
  utm_source text, utm_medium text, utm_campaign text, utm_content text,
  status      lead_status default 'new',
  assigned_to uuid references auth.users(id) on delete set null,
  answers  jsonb,                              -- college finder payload
  ip       inet,
  user_agent text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
create index leads_created_at_idx on leads (created_at desc);
create index leads_status_idx     on leads (status);
create index leads_phone_idx      on leads (phone);

create trigger leads_set_updated_at
  before update on leads
  for each row execute function public.set_updated_at();

create table lead_activities (
  id      uuid primary key default gen_random_uuid(),
  lead_id uuid references leads(id) on delete cascade,
  user_id uuid references auth.users(id) on delete set null,
  action  text,
  note    text,
  created_at timestamptz default now()
);
create index lead_activities_lead_id_idx on lead_activities (lead_id, created_at desc);

create table finder_sessions (
  id         uuid primary key default gen_random_uuid(),
  session_id text,
  step       int,
  answers    jsonb,
  lead_id    uuid references leads(id) on delete set null,
  created_at timestamptz default now()
);
-- one row per anonymous session, upserted on every wizard step (PRD §5.4)
create unique index finder_sessions_session_id_key on finder_sessions (session_id);

-- ─────────────────────────────────────────────────────────────
-- Content
-- ─────────────────────────────────────────────────────────────
create table blogs (
  id       uuid primary key default gen_random_uuid(),
  title    text not null,
  slug     text unique not null,
  excerpt  text,
  content  text,
  cover_url text,
  category text,
  tags     text[],
  author   text,
  read_minutes int,
  published_at timestamptz,
  status   content_status default 'draft',
  meta_title text,
  meta_description text
);
create index blogs_status_idx on blogs (status, published_at desc);

-- Written out rather than `like blogs including all` so the generated types
-- stay explicit and the two tables can diverge later.
create table news (
  id       uuid primary key default gen_random_uuid(),
  title    text not null,
  slug     text unique not null,
  excerpt  text,
  content  text,
  cover_url text,
  category text,
  tags     text[],
  author   text,
  read_minutes int,
  published_at timestamptz,
  status   content_status default 'draft',
  meta_title text,
  meta_description text
);
create index news_status_idx on news (status, published_at desc);

create table guides (
  id     uuid primary key default gen_random_uuid(),
  title  text not null,
  slug   text unique not null,
  level  level_enum,
  content text,
  cover_url text,
  status content_status default 'published',
  meta_title text,
  meta_description text
);
create index guides_level_idx on guides (level, status);

create table testimonials (
  id           uuid primary key default gen_random_uuid(),
  student_name text not null,
  photo_url    text,
  company      text,
  package_lpa  numeric,
  course       text,
  city         text,
  college_id   uuid references colleges(id) on delete set null,
  quote        text,
  sort_order   int  default 0,
  is_active    bool default true
);

create table gallery (
  id        uuid primary key default gen_random_uuid(),
  image_url text not null,
  caption   text,
  event_date date,
  sort_order int default 0
);

create table press_releases (
  id           uuid primary key default gen_random_uuid(),
  publication  text not null,
  image_url    text,
  article_url  text,
  published_on date
);

create table banners (
  id        uuid primary key default gen_random_uuid(),
  title     text,
  image_url text,
  image_mobile_url text,
  cta_text  text,
  cta_url   text,
  sort_order int default 0,
  is_active bool default true
);

create table faqs (
  id       uuid primary key default gen_random_uuid(),
  question text not null,
  answer   text not null,
  scope    text default 'home',   -- home | college | course | exam | finder
  ref_id   uuid,
  sort_order int default 0
);
create index faqs_scope_idx on faqs (scope, ref_id);

create table reviews (
  id         uuid primary key default gen_random_uuid(),
  college_id uuid references colleges(id) on delete cascade,
  name   text,
  email  text,
  course text,
  rating int check (rating between 1 and 5),
  title  text,
  body   text,
  is_approved bool default false,
  created_at  timestamptz default now()
);
create index reviews_college_id_idx on reviews (college_id, is_approved);

create table scholarships (
  id      uuid primary key default gen_random_uuid(),
  title   text not null,
  slug    text unique not null,
  state   text,
  content text,
  image_url text,
  status  content_status default 'published',
  meta_title text,
  meta_description text
);

-- ─────────────────────────────────────────────────────────────
-- Staff & settings
-- ─────────────────────────────────────────────────────────────
create table profiles (
  id        uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  role      user_role default 'counsellor',
  phone     text,
  is_active bool default true
);

create table settings (
  key   text primary key,
  value jsonb
);

-- Every authenticated user gets a profile row; role is promoted manually.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'full_name', new.email))
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Keeps colleges.rating / review_count in sync with approved reviews.
create or replace function public.refresh_college_rating()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  target uuid := coalesce(new.college_id, old.college_id);
begin
  update colleges c
     set rating = coalesce((
           select round(avg(r.rating)::numeric, 1)
             from reviews r
            where r.college_id = target and r.is_approved
         ), 0),
         review_count = (
           select count(*) from reviews r
            where r.college_id = target and r.is_approved
         )
   where c.id = target;
  return null;
end;
$$;

create trigger reviews_refresh_college_rating
  after insert or update or delete on reviews
  for each row execute function public.refresh_college_rating();
