-- CareerOptics — row level security (PRD §7)
--
-- Rule: every table has RLS on. Public content is readable by anon when
-- published/active/approved. leads, finder_sessions, lead_activities, profiles
-- and settings get NO anon policy at all — those writes only ever happen with
-- the service-role key inside /api/*, which bypasses RLS.

alter table states           enable row level security;
alter table cities           enable row level security;
alter table streams          enable row level security;
alter table courses          enable row level security;
alter table colleges         enable row level security;
alter table college_courses  enable row level security;
alter table college_gallery  enable row level security;
alter table exams            enable row level security;
alter table exam_courses     enable row level security;
alter table leads            enable row level security;
alter table lead_activities  enable row level security;
alter table finder_sessions  enable row level security;
alter table blogs            enable row level security;
alter table news             enable row level security;
alter table guides           enable row level security;
alter table testimonials     enable row level security;
alter table gallery          enable row level security;
alter table press_releases   enable row level security;
alter table banners          enable row level security;
alter table faqs             enable row level security;
alter table reviews          enable row level security;
alter table scholarships     enable row level security;
alter table profiles         enable row level security;
alter table settings         enable row level security;

-- ─────────────────────────────────────────────────────────────
-- Helpers
-- ─────────────────────────────────────────────────────────────

-- security definer so the policy can read profiles without recursing into
-- the profiles policies below.
create or replace function public.is_staff()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles p
     where p.id = auth.uid() and p.is_active
  );
$$;

create or replace function public.is_super_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles p
     where p.id = auth.uid() and p.is_active and p.role = 'super_admin'
  );
$$;

-- ─────────────────────────────────────────────────────────────
-- Public reference data — always readable
-- ─────────────────────────────────────────────────────────────
create policy "public read" on states        for select to anon, authenticated using (true);
create policy "public read" on cities        for select to anon, authenticated using (true);
create policy "public read" on streams       for select to anon, authenticated using (true);
create policy "public read" on exam_courses  for select to anon, authenticated using (true);

-- ─────────────────────────────────────────────────────────────
-- Published content
-- ─────────────────────────────────────────────────────────────
create policy "public read" on courses      for select to anon, authenticated using (status = 'published');
create policy "public read" on colleges     for select to anon, authenticated using (status = 'published');
create policy "public read" on exams        for select to anon, authenticated using (status = 'published');
create policy "public read" on guides       for select to anon, authenticated using (status = 'published');
create policy "public read" on scholarships for select to anon, authenticated using (status = 'published');
create policy "public read" on blogs        for select to anon, authenticated using (status = 'published');
create policy "public read" on news         for select to anon, authenticated using (status = 'published');

-- Child rows are only exposed when their parent college is published.
create policy "public read" on college_courses for select to anon, authenticated
  using (exists (select 1 from colleges c where c.id = college_id and c.status = 'published'));
create policy "public read" on college_gallery for select to anon, authenticated
  using (exists (select 1 from colleges c where c.id = college_id and c.status = 'published'));

-- ─────────────────────────────────────────────────────────────
-- Flag-gated content
-- ─────────────────────────────────────────────────────────────
create policy "public read" on testimonials   for select to anon, authenticated using (is_active);
create policy "public read" on banners        for select to anon, authenticated using (is_active);
create policy "public read" on gallery        for select to anon, authenticated using (true);
create policy "public read" on press_releases for select to anon, authenticated using (true);
create policy "public read" on faqs           for select to anon, authenticated using (true);

create policy "public read approved" on reviews for select to anon, authenticated using (is_approved);

-- ─────────────────────────────────────────────────────────────
-- Staff writes on content (Server Actions run with the user's JWT)
-- ─────────────────────────────────────────────────────────────
do $$
declare t text;
begin
  foreach t in array array[
    'states','cities','streams','courses','colleges','college_courses',
    'college_gallery','exams','exam_courses','blogs','news','guides',
    'testimonials','gallery','press_releases','banners','faqs','reviews',
    'scholarships'
  ]
  loop
    execute format(
      'create policy "staff read all" on %I for select to authenticated using (public.is_staff())', t);
    execute format(
      'create policy "staff insert" on %I for insert to authenticated with check (public.is_staff())', t);
    execute format(
      'create policy "staff update" on %I for update to authenticated using (public.is_staff()) with check (public.is_staff())', t);
    execute format(
      'create policy "staff delete" on %I for delete to authenticated using (public.is_staff())', t);
  end loop;
end $$;

-- ─────────────────────────────────────────────────────────────
-- Leads — no anon access whatsoever. Inserts go through /api/leads.
-- ─────────────────────────────────────────────────────────────
create policy "staff read leads" on leads for select to authenticated
  using (public.is_staff());
create policy "staff update leads" on leads for update to authenticated
  using (public.is_staff()) with check (public.is_staff());
create policy "super admin delete leads" on leads for delete to authenticated
  using (public.is_super_admin());

create policy "staff read activities" on lead_activities for select to authenticated
  using (public.is_staff());
create policy "staff insert activities" on lead_activities for insert to authenticated
  with check (public.is_staff() and user_id = auth.uid());

create policy "staff read finder sessions" on finder_sessions for select to authenticated
  using (public.is_staff());

-- ─────────────────────────────────────────────────────────────
-- Profiles & settings
-- ─────────────────────────────────────────────────────────────
create policy "read own profile" on profiles for select to authenticated
  using (id = auth.uid() or public.is_staff());
create policy "update own profile" on profiles for update to authenticated
  using (id = auth.uid()) with check (id = auth.uid() and role = (select p.role from profiles p where p.id = auth.uid()));
create policy "super admin manage profiles" on profiles for all to authenticated
  using (public.is_super_admin()) with check (public.is_super_admin());

create policy "staff read settings" on settings for select to authenticated
  using (public.is_staff());
create policy "super admin write settings" on settings for all to authenticated
  using (public.is_super_admin()) with check (public.is_super_admin());
