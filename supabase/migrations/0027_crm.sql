-- CareerOptics — CRM (ported from the HELLODOCTOR admission CRM).
--
-- Everything lives in its own `crm` schema. The website already owns
-- `public.leads`, `public.profiles` and `public.courses`, with different
-- shapes; a schema keeps both products intact and lets them share one
-- Supabase project, one auth.users and one storage.
--
-- After applying: add `crm` to Project Settings → API → Exposed schemas
-- (the setup script does this through the Management API).

create schema if not exists crm;
grant usage on schema crm to anon, authenticated, service_role;
set search_path = crm, public, extensions;

-- ────────────────────────────────────────────────────────────
-- STEP 2: CRM tables (Admission CRM — saari migrations order me)
-- ────────────────────────────────────────────────────────────

-- ────────────────────────────────────────────────────────────
-- MIGRATION: 001_profiles.sql
-- ────────────────────────────────────────────────────────────
-- Profiles table (extends auth.users)
create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null unique,
  full_name text not null,
  role text not null check (role in ('admin', 'telecaller', 'backend', 'finance')),
  phone text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- RLS
alter table profiles enable row level security;

DROP POLICY IF EXISTS "Users can view all active profiles" ON profiles;
create policy "Users can view all active profiles"
  on profiles for select
  using (auth.uid() is not null);

DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
create policy "Users can update own profile"
  on profiles for update
  using (auth.uid() = id);

DROP POLICY IF EXISTS "Admins can manage all profiles" ON profiles;
create policy "Admins can manage all profiles"
  on profiles for all
  using (
    exists (
      select 1 from profiles p where p.id = auth.uid() and p.role = 'admin'
    )
  );


-- ────────────────────────────────────────────────────────────
-- MIGRATION: 002_courses_and_subcourses.sql
-- ────────────────────────────────────────────────────────────
create table if not exists courses (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists sub_courses (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references courses(id) on delete cascade,
  name text not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

alter table courses enable row level security;
alter table sub_courses enable row level security;

DROP POLICY IF EXISTS "Authenticated users can view courses" ON courses;
create policy "Authenticated users can view courses"
  on courses for select using (auth.uid() is not null);

DROP POLICY IF EXISTS "Admins can manage courses" ON courses;
create policy "Admins can manage courses"
  on courses for all using (
    exists (select 1 from profiles where id = auth.uid() and role = 'admin')
  );

DROP POLICY IF EXISTS "Authenticated users can view sub_courses" ON sub_courses;
create policy "Authenticated users can view sub_courses"
  on sub_courses for select using (auth.uid() is not null);

DROP POLICY IF EXISTS "Admins can manage sub_courses" ON sub_courses;
create policy "Admins can manage sub_courses"
  on sub_courses for all using (
    exists (select 1 from profiles where id = auth.uid() and role = 'admin')
  );


-- ────────────────────────────────────────────────────────────
-- MIGRATION: 003_leads.sql
-- ────────────────────────────────────────────────────────────
create table if not exists leads (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  phone text not null,
  email text,
  city text,
  state text,
  course_id uuid references courses(id) on delete set null,
  sub_course_id uuid references sub_courses(id) on delete set null,
  status text not null default 'new' check (status in (
    'new','contacted','interested','counselled','application_sent','converted','cold','lost'
  )),
  source text not null check (source in (
    'website','walk_in','referral','whatsapp','phone','excel_import','social_media','other'
  )),
  assigned_to uuid references profiles(id) on delete set null,
  assigned_at timestamptz,
  next_followup_date date,
  total_fee numeric(12,2),
  amount_paid numeric(12,2) not null default 0,
  converted_at timestamptz,
  import_batch_id text,
  created_by uuid references profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table leads enable row level security;

DROP POLICY IF EXISTS "Admin and backend can view all leads" ON leads;
create policy "Admin and backend can view all leads"
  on leads for select
  using (
    exists (select 1 from profiles where id = auth.uid() and role in ('admin','backend'))
  );

DROP POLICY IF EXISTS "Telecaller can view own leads" ON leads;
create policy "Telecaller can view own leads"
  on leads for select
  using (
    auth.uid() = assigned_to or auth.uid() = created_by
  );

DROP POLICY IF EXISTS "Telecaller and admin can insert leads" ON leads;
create policy "Telecaller and admin can insert leads"
  on leads for insert
  with check (
    exists (select 1 from profiles where id = auth.uid() and role in ('admin','telecaller','backend'))
  );

DROP POLICY IF EXISTS "Admin and telecaller can update own leads" ON leads;
create policy "Admin and telecaller can update own leads"
  on leads for update
  using (
    exists (select 1 from profiles where id = auth.uid() and role = 'admin')
    or auth.uid() = assigned_to
  );


-- ────────────────────────────────────────────────────────────
-- MIGRATION: 004_lead_activities.sql
-- ────────────────────────────────────────────────────────────
create table if not exists lead_activities (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid not null references leads(id) on delete cascade,
  activity_type text not null check (activity_type in (
    'created','status_changed','assigned','transferred','note_added',
    'followup_set','payment_received','converted','document_uploaded','call_made'
  )),
  old_value text,
  new_value text,
  note text,
  performed_by uuid references profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

alter table lead_activities enable row level security;

DROP POLICY IF EXISTS "Users with lead access can view activities" ON lead_activities;
create policy "Users with lead access can view activities"
  on lead_activities for select
  using (auth.uid() is not null);

DROP POLICY IF EXISTS "Users can insert activities" ON lead_activities;
create policy "Users can insert activities"
  on lead_activities for insert
  with check (auth.uid() is not null);


-- ────────────────────────────────────────────────────────────
-- MIGRATION: 005_lead_column_preferences.sql
-- ────────────────────────────────────────────────────────────
create table if not exists lead_column_preferences (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  column_key text not null,
  is_visible boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, column_key)
);

alter table lead_column_preferences enable row level security;

DROP POLICY IF EXISTS "Users manage own preferences" ON lead_column_preferences;
create policy "Users manage own preferences"
  on lead_column_preferences for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);


-- ────────────────────────────────────────────────────────────
-- MIGRATION: 006_payments.sql
-- ────────────────────────────────────────────────────────────
create table if not exists payments (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid references leads(id) on delete set null,
  student_id uuid,  -- will add FK after students table created
  amount numeric(12,2) not null check (amount > 0),
  payment_mode text not null check (payment_mode in ('cash','upi','card','neft','rtgs','cheque','other')),
  payment_date date not null,
  receipt_number text,
  notes text,
  recorded_by uuid references profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

alter table payments enable row level security;

DROP POLICY IF EXISTS "Admin, backend, finance can view payments" ON payments;
create policy "Admin, backend, finance can view payments"
  on payments for select
  using (
    exists (select 1 from profiles where id = auth.uid() and role in ('admin','backend','finance'))
  );

DROP POLICY IF EXISTS "Backend and admin can insert payments" ON payments;
create policy "Backend and admin can insert payments"
  on payments for insert
  with check (
    exists (select 1 from profiles where id = auth.uid() and role in ('admin','backend'))
  );


-- ────────────────────────────────────────────────────────────
-- MIGRATION: 007_students.sql
-- ────────────────────────────────────────────────────────────
create table if not exists students (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid references leads(id) on delete set null unique,
  enrollment_number text not null unique default 'ENR-' || floor(random() * 900000 + 100000)::text,
  full_name text not null,
  phone text not null,
  email text,
  city text,
  course_id uuid references courses(id) on delete set null,
  sub_course_id uuid references sub_courses(id) on delete set null,
  assigned_counsellor uuid references profiles(id) on delete set null,
  total_fee numeric(12,2),
  amount_paid numeric(12,2) not null default 0,
  enrollment_date date,
  status text not null default 'active' check (status in ('active','completed','dropped','on_hold')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Add FK from payments to students
ALTER TABLE payments DROP CONSTRAINT IF EXISTS payments_student_id_fkey;
alter table payments add constraint payments_student_id_fkey
  foreign key (student_id) references students(id) on delete set null;

alter table students enable row level security;

DROP POLICY IF EXISTS "Admin and backend can view all students" ON students;
create policy "Admin and backend can view all students"
  on students for select
  using (
    exists (select 1 from profiles where id = auth.uid() and role in ('admin','backend','finance'))
  );

DROP POLICY IF EXISTS "Admin and backend can manage students" ON students;
create policy "Admin and backend can manage students"
  on students for all
  using (
    exists (select 1 from profiles where id = auth.uid() and role in ('admin','backend'))
  );


-- ────────────────────────────────────────────────────────────
-- MIGRATION: 008_student_documents.sql
-- ────────────────────────────────────────────────────────────
create table if not exists student_documents (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references students(id) on delete cascade,
  doc_type text not null check (doc_type in (
    '10th_marksheet','12th_marksheet','graduation','passport',
    'sop','lor','ielts_scorecard','pte_scorecard','offer_letter','visa','other'
  )),
  status text not null default 'pending' check (status in ('pending','received','verified','rejected')),
  file_url text,
  notes text,
  expiry_date date,
  uploaded_by uuid references profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (student_id, doc_type)
);

alter table student_documents enable row level security;

DROP POLICY IF EXISTS "Admin and backend can manage documents" ON student_documents;
create policy "Admin and backend can manage documents"
  on student_documents for all
  using (
    exists (select 1 from profiles where id = auth.uid() and role in ('admin','backend'))
  );


-- ────────────────────────────────────────────────────────────
-- MIGRATION: 009_student_exams.sql
-- ────────────────────────────────────────────────────────────
create table if not exists student_exams (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references students(id) on delete cascade,
  exam_type text not null check (exam_type in (
    'ielts','pte','toefl','practical','final_exam','mock_test','other'
  )),
  exam_name text not null,
  exam_date date,
  centre text,
  hall_ticket_number text,
  admit_card_url text,
  score text,
  is_passed boolean,
  remarks text,
  created_at timestamptz not null default now()
);

alter table student_exams enable row level security;

DROP POLICY IF EXISTS "Admin and backend can manage exams" ON student_exams;
create policy "Admin and backend can manage exams"
  on student_exams for all
  using (
    exists (select 1 from profiles where id = auth.uid() and role in ('admin','backend'))
  );


-- ────────────────────────────────────────────────────────────
-- MIGRATION: 010_employees.sql
-- ────────────────────────────────────────────────────────────
create table if not exists employees (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references profiles(id) on delete cascade unique,
  employee_code text not null unique default 'EMP-' || floor(random() * 90000 + 10000)::text,
  department text,
  designation text,
  joining_date date,
  basic_salary numeric(12,2) default 0,
  hra numeric(12,2) default 0,
  allowances numeric(12,2) default 0,
  incentive numeric(12,2) default 0,
  pf_deduction numeric(12,2) default 0,
  tds_deduction numeric(12,2) default 0,
  other_deductions numeric(12,2) default 0,
  bank_account text,
  bank_ifsc text,
  bank_name text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table employees enable row level security;

DROP POLICY IF EXISTS "Admins can manage employees" ON employees;
create policy "Admins can manage employees"
  on employees for all
  using (
    exists (select 1 from profiles where id = auth.uid() and role = 'admin')
  );

DROP POLICY IF EXISTS "Employees can view own record" ON employees;
create policy "Employees can view own record"
  on employees for select
  using (profile_id = auth.uid());


-- ────────────────────────────────────────────────────────────
-- MIGRATION: 011_attendance.sql
-- ────────────────────────────────────────────────────────────
create table if not exists attendance (
  id uuid primary key default gen_random_uuid(),
  employee_id uuid not null references employees(id) on delete cascade,
  date date not null,
  status text not null check (status in ('present','absent','half_day','late','leave','holiday')),
  clock_in time,
  clock_out time,
  notes text,
  marked_by uuid references profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  unique (employee_id, date)
);

alter table attendance enable row level security;

DROP POLICY IF EXISTS "Admins can manage attendance" ON attendance;
create policy "Admins can manage attendance"
  on attendance for all
  using (
    exists (select 1 from profiles where id = auth.uid() and role = 'admin')
  );

DROP POLICY IF EXISTS "Employees can view own attendance" ON attendance;
create policy "Employees can view own attendance"
  on attendance for select
  using (
    exists (select 1 from employees where id = employee_id and profile_id = auth.uid())
  );


-- ────────────────────────────────────────────────────────────
-- MIGRATION: 012_leave_requests.sql
-- ────────────────────────────────────────────────────────────
create table if not exists leave_requests (
  id uuid primary key default gen_random_uuid(),
  employee_id uuid not null references employees(id) on delete cascade,
  leave_type text not null check (leave_type in ('sick','casual','earned','unpaid','other')),
  from_date date not null,
  to_date date not null,
  reason text,
  status text not null default 'pending' check (status in ('pending','approved','rejected')),
  approved_by uuid references profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

alter table leave_requests enable row level security;

DROP POLICY IF EXISTS "Admins can manage leave requests" ON leave_requests;
create policy "Admins can manage leave requests"
  on leave_requests for all
  using (
    exists (select 1 from profiles where id = auth.uid() and role = 'admin')
  );

DROP POLICY IF EXISTS "Employees can manage own leave" ON leave_requests;
create policy "Employees can manage own leave"
  on leave_requests for all
  using (
    exists (select 1 from employees where id = employee_id and profile_id = auth.uid())
  );


-- ────────────────────────────────────────────────────────────
-- MIGRATION: 013_payroll.sql
-- ────────────────────────────────────────────────────────────
create table if not exists payroll (
  id uuid primary key default gen_random_uuid(),
  employee_id uuid not null references employees(id) on delete cascade,
  month integer not null check (month between 1 and 12),
  year integer not null,
  basic numeric(12,2) not null default 0,
  hra numeric(12,2) not null default 0,
  allowances numeric(12,2) not null default 0,
  incentive numeric(12,2) not null default 0,
  gross numeric(12,2) not null default 0,
  pf numeric(12,2) not null default 0,
  tds numeric(12,2) not null default 0,
  other_deductions numeric(12,2) not null default 0,
  net numeric(12,2) not null default 0,
  status text not null default 'draft' check (status in ('draft','processed','paid')),
  payment_date date,
  created_at timestamptz not null default now(),
  unique (employee_id, month, year)
);

alter table payroll enable row level security;

DROP POLICY IF EXISTS "Admins can manage payroll" ON payroll;
create policy "Admins can manage payroll"
  on payroll for all
  using (
    exists (select 1 from profiles where id = auth.uid() and role = 'admin')
  );

DROP POLICY IF EXISTS "Employees can view own payroll" ON payroll;
create policy "Employees can view own payroll"
  on payroll for select
  using (
    exists (select 1 from employees where id = employee_id and profile_id = auth.uid())
  );


-- ────────────────────────────────────────────────────────────
-- MIGRATION: 014_expenses.sql
-- ────────────────────────────────────────────────────────────
create table if not exists expenses (
  id uuid primary key default gen_random_uuid(),
  category text not null check (category in (
    'rent','utilities','marketing','travel','salary','vendor','misc','other'
  )),
  description text not null,
  amount numeric(12,2) not null check (amount > 0),
  expense_date date not null,
  payment_mode text,
  bill_url text,
  notes text,
  submitted_by uuid references profiles(id) on delete set null,
  approved_by uuid references profiles(id) on delete set null,
  status text not null default 'pending' check (status in ('pending','approved','rejected')),
  created_at timestamptz not null default now()
);

alter table expenses enable row level security;

DROP POLICY IF EXISTS "Finance and admin can view all expenses" ON expenses;
create policy "Finance and admin can view all expenses"
  on expenses for select
  using (
    exists (select 1 from profiles where id = auth.uid() and role in ('admin','finance'))
  );

DROP POLICY IF EXISTS "All staff can submit expenses" ON expenses;
create policy "All staff can submit expenses"
  on expenses for insert
  with check (auth.uid() is not null);

DROP POLICY IF EXISTS "Finance and admin can update expenses" ON expenses;
create policy "Finance and admin can update expenses"
  on expenses for update
  using (
    exists (select 1 from profiles where id = auth.uid() and role in ('admin','finance'))
  );


-- ────────────────────────────────────────────────────────────
-- MIGRATION: 015_triggers.sql
-- ────────────────────────────────────────────────────────────
-- Auto updated_at
create extension if not exists moddatetime schema extensions;

DROP TRIGGER IF EXISTS set_updated_at_profiles ON profiles;
CREATE TRIGGER set_updated_at_profiles
  before update ON profiles
  for each row execute procedure moddatetime(updated_at);

DROP TRIGGER IF EXISTS set_updated_at_leads ON leads;
CREATE TRIGGER set_updated_at_leads
  before update ON leads
  for each row execute procedure moddatetime(updated_at);

DROP TRIGGER IF EXISTS set_updated_at_students ON students;
CREATE TRIGGER set_updated_at_students
  before update ON students
  for each row execute procedure moddatetime(updated_at);

DROP TRIGGER IF EXISTS set_updated_at_employees ON employees;
CREATE TRIGGER set_updated_at_employees
  before update ON employees
  for each row execute procedure moddatetime(updated_at);

-- Lead conversion → auto-create student
create or replace function handle_lead_conversion()
returns trigger as $$
begin
  if NEW.status = 'converted' and OLD.status != 'converted' then
    insert into students (
      lead_id, full_name, phone, email,
      course_id, sub_course_id, assigned_counsellor,
      total_fee, amount_paid, enrollment_date
    ) values (
      NEW.id, NEW.full_name, NEW.phone, NEW.email,
      NEW.course_id, NEW.sub_course_id, NEW.assigned_to,
      NEW.total_fee, NEW.amount_paid, current_date
    )
    on conflict (lead_id) do nothing;
    NEW.converted_at = now();
  end if;
  return NEW;
end;
$$ language plpgsql security definer;

DROP TRIGGER IF EXISTS on_lead_converted ON leads;
CREATE TRIGGER on_lead_converted
  before update ON leads
  for each row execute procedure handle_lead_conversion();

-- Payment insert → update amount_paid on leads and students
create or replace function handle_payment_insert()
returns trigger as $$
begin
  if NEW.lead_id is not null then
    update leads set
      amount_paid = (select coalesce(sum(amount),0) from payments where lead_id = NEW.lead_id)
    where id = NEW.lead_id;
  end if;

  if NEW.lead_id is not null then
    update students set
      amount_paid = (select coalesce(sum(amount),0) from payments where lead_id = NEW.lead_id)
    where lead_id = NEW.lead_id;
  end if;

  return NEW;
end;
$$ language plpgsql security definer;

DROP TRIGGER IF EXISTS on_payment_inserted ON payments;
CREATE TRIGGER on_payment_inserted
  after insert ON payments
  for each row execute procedure handle_payment_insert();

-- Auto-log lead created
create or replace function log_lead_created()
returns trigger as $$
begin
  insert into lead_activities (lead_id, activity_type, new_value, performed_by)
  values (NEW.id, 'created', NEW.status, NEW.created_by);
  return NEW;
end;
$$ language plpgsql security definer;

DROP TRIGGER IF EXISTS on_lead_created ON leads;
CREATE TRIGGER on_lead_created
  after insert ON leads
  for each row execute procedure log_lead_created();

-- Auto-log lead status/assignment change
create or replace function log_lead_status_change()
returns trigger as $$
begin
  if OLD.status != NEW.status then
    insert into lead_activities (lead_id, activity_type, old_value, new_value, performed_by)
    values (NEW.id, 'status_changed', OLD.status, NEW.status, auth.uid());
  end if;
  if OLD.assigned_to is distinct from NEW.assigned_to then
    insert into lead_activities (lead_id, activity_type, old_value, new_value, performed_by)
    values (NEW.id, 'assigned',
      (select full_name from profiles where id = OLD.assigned_to),
      (select full_name from profiles where id = NEW.assigned_to),
      auth.uid());
  end if;
  return NEW;
end;
$$ language plpgsql security definer;

DROP TRIGGER IF EXISTS on_lead_updated ON leads;
CREATE TRIGGER on_lead_updated
  after update ON leads
  for each row execute procedure log_lead_status_change();


-- ────────────────────────────────────────────────────────────
-- MIGRATION: 016_indexes.sql
-- ────────────────────────────────────────────────────────────
-- Performance indexes
create index if not exists idx_leads_status on leads(status);
create index if not exists idx_leads_assigned_to on leads(assigned_to);
create index if not exists idx_leads_created_at on leads(created_at desc);
create index if not exists idx_leads_next_followup on leads(next_followup_date);
create index if not exists idx_leads_import_batch on leads(import_batch_id);
create index if not exists idx_leads_phone on leads(phone);
create index if not exists idx_leads_source on leads(source);

create index if not exists idx_lead_activities_lead_id on lead_activities(lead_id);
create index if not exists idx_lead_activities_created_at on lead_activities(created_at desc);

create index if not exists idx_payments_lead_id on payments(lead_id);
create index if not exists idx_payments_student_id on payments(student_id);
create index if not exists idx_payments_payment_date on payments(payment_date desc);

create index if not exists idx_students_course_id on students(course_id);
create index if not exists idx_students_assigned_counsellor on students(assigned_counsellor);
create index if not exists idx_students_status on students(status);

create index if not exists idx_student_documents_student_id on student_documents(student_id);
create index if not exists idx_student_exams_student_id on student_exams(student_id);

create index if not exists idx_attendance_employee_date on attendance(employee_id, date);
create index if not exists idx_payroll_employee_month on payroll(employee_id, year, month);
create index if not exists idx_expenses_status on expenses(status);
create index if not exists idx_expenses_date on expenses(expense_date desc);


-- ────────────────────────────────────────────────────────────
-- MIGRATION: 017_add_frontend_skill_sikho.sql
-- ────────────────────────────────────────────────────────────
-- Add Frontend Skill Sikho course
INSERT INTO courses (name) VALUES ('Frontend Skill Sikho');

-- Add sub-courses for Frontend Skill Sikho
INSERT INTO sub_courses (course_id, name)
SELECT c.id, s.name
FROM courses c
CROSS JOIN (
  VALUES 
    ('React.js'),
    ('HTML & CSS'),
    ('JavaScript Fundamentals'),
    ('Next.js'),
    ('TypeScript')
) AS s(name)
WHERE c.name = 'Frontend Skill Sikho';


-- ────────────────────────────────────────────────────────────
-- MIGRATION: 018_departments.sql
-- ────────────────────────────────────────────────────────────
-- Create departments table
create table if not exists departments (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

-- Create department sub-sections table (University/Board)
create table if not exists department_sub_sections (
  id uuid primary key default gen_random_uuid(),
  department_id uuid not null references departments(id) on delete cascade,
  name text not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

-- Add columns to leads table
alter table leads 
add column if not exists department_id uuid references departments(id) on delete set null,
add column if not exists sub_section_id uuid references department_sub_sections(id) on delete set null;

-- Enable RLS
alter table departments enable row level security;
alter table department_sub_sections enable row level security;

-- Policies for departments
DROP POLICY IF EXISTS "Authenticated users can view departments" ON departments;
create policy "Authenticated users can view departments"
  on departments for select using (auth.uid() is not null);

DROP POLICY IF EXISTS "Admins can manage departments" ON departments;
create policy "Admins can manage departments"
  on departments for all using (
    exists (select 1 from profiles where id = auth.uid() and role = 'admin')
  );

-- Policies for sub-sections
DROP POLICY IF EXISTS "Authenticated users can view sub_sections" ON department_sub_sections;
create policy "Authenticated users can view sub_sections"
  on department_sub_sections for select using (auth.uid() is not null);

DROP POLICY IF EXISTS "Admins can manage sub_sections" ON department_sub_sections;
create policy "Admins can manage sub_sections"
  on department_sub_sections for all using (
    exists (select 1 from profiles where id = auth.uid() and role = 'admin')
  );


-- ────────────────────────────────────────────────────────────
-- MIGRATION: 019_add_updated_activity_type.sql
-- ────────────────────────────────────────────────────────────
-- Add 'updated' to the activity_type check constraint
alter table lead_activities drop constraint if exists lead_activities_activity_type_check;

ALTER TABLE lead_activities DROP CONSTRAINT IF EXISTS lead_activities_activity_type_check;
alter table lead_activities add constraint lead_activities_activity_type_check 
check (activity_type in (
  'created','status_changed','assigned','transferred','note_added',
  'followup_set','payment_received','converted', 'document_uploaded', 'call_made', 'updated'
));


-- ────────────────────────────────────────────────────────────
-- MIGRATION: 020_sessions.sql
-- ────────────────────────────────────────────────────────────
create table if not exists sessions (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

alter table sessions enable row level security;

DROP POLICY IF EXISTS "Authenticated users can view sessions" ON sessions;
create policy "Authenticated users can view sessions"
  on sessions for select using (auth.uid() is not null);

DROP POLICY IF EXISTS "Admins can manage sessions" ON sessions;
create policy "Admins can manage sessions"
  on sessions for all using (
    exists (select 1 from profiles where id = auth.uid() and role = 'admin')
  );

-- Add column to leads table
alter table leads
add column if not exists session_id uuid references sessions(id) on delete set null;



-- ────────────────────────────────────────────────────────────
-- MIGRATION: 021_add_incentive_to_students.sql
-- ────────────────────────────────────────────────────────────
-- Add incentive column to students table
alter table students 
add column if not exists incentive_amount numeric(10,2) default 0;


-- ────────────────────────────────────────────────────────────
-- MIGRATION: 022_auto_employees.sql
-- ────────────────────────────────────────────────────────────
-- Migration: Auto backfill missing employees for profiles

DO $$
DECLARE
    r RECORD;
BEGIN
    -- Backfill all existing profiles that don't have an employee record yet
    FOR r IN (
        SELECT id FROM profiles
        WHERE id NOT IN (SELECT profile_id FROM employees)
    ) LOOP
        INSERT INTO employees (profile_id)
        VALUES (r.id)
        ON CONFLICT (profile_id) DO NOTHING;
    END LOOP;
END;
$$;

-- Create the trigger function for future inserts
CREATE OR REPLACE FUNCTION auto_create_employee()
RETURNS TRIGGER AS $$
BEGIN
    -- Only create an employee record if it doesn't already exist
    INSERT INTO employees (profile_id)
    VALUES (NEW.id)
    ON CONFLICT (profile_id) DO NOTHING;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing trigger if any (safety measure)
DROP TRIGGER IF EXISTS on_profile_created ON profiles;

-- Create the new trigger to fire right after a User profile is created
DROP TRIGGER IF EXISTS on_profile_created ON profiles;
CREATE TRIGGER on_profile_created
AFTER INSERT ON profiles
FOR EACH ROW EXECUTE PROCEDURE auto_create_employee();


-- ────────────────────────────────────────────────────────────
-- MIGRATION: 023_finance_automation.sql
-- ────────────────────────────────────────────────────────────
-- 1. Modify 'payments' table to let Finance team insert manual income.
drop policy if exists "Backend and admin can insert payments" on payments;
drop policy if exists "Staff can insert payments" on payments;

DROP POLICY IF EXISTS "Staff can insert payments" ON payments;
create policy "Staff can insert payments"
  on payments for insert
  with check (
    exists (select 1 from profiles where id = auth.uid() and role in ('admin','backend','finance'))
  );

-- 2. Add payroll_id reference to expenses to link them natively
alter table expenses add column if not exists payroll_id uuid references payroll(id) on delete set null;

-- 3. Trigger on payroll for auto-salary conversion to Expense Ledger
create or replace function handle_payroll_paid()
returns trigger as $$
declare
    emp_name text;
begin
    -- Whenever payroll status flips precisely to 'paid'
    if NEW.status = 'paid' and OLD.status != 'paid' then
        -- Grab employee actual name
        select full_name into emp_name from profiles
        where id = (select profile_id from employees where id = NEW.employee_id);
        
        insert into expenses (
            payroll_id,
            category,
            description,
            amount,
            expense_date,
            status,
            payment_mode
        ) values (
            NEW.id,
            'salary',
            'Salary Paid - ' || coalesce(emp_name, 'Employee') || ' - ' || NEW.month || '/' || NEW.year,
            NEW.net,
            (coalesce(NEW.payment_date, current_date))::date,
            'approved',
            'neft'
        );
    end if;
    return NEW;
end;
$$ language plpgsql security definer;

drop trigger if exists on_payroll_paid on payroll;
DROP TRIGGER IF EXISTS on_payroll_paid ON payroll;
CREATE TRIGGER on_payroll_paid
after update ON payroll
for each row execute procedure handle_payroll_paid();


-- ────────────────────────────────────────────────────────────
-- MIGRATION: 024_finance_backfill.sql
-- ────────────────────────────────────────────────────────────
-- 1. Backfill Past Payrolls into Expenses
DO $$
DECLARE
    r RECORD;
    emp_name text;
BEGIN
    FOR r IN (
        SELECT p.*, e.profile_id FROM payroll p
        JOIN employees e ON p.employee_id = e.id
        WHERE p.status = 'paid'
        AND NOT EXISTS (SELECT 1 FROM expenses WHERE payroll_id = p.id)
    ) LOOP
        -- Get profile name
        SELECT full_name INTO emp_name FROM profiles WHERE id = r.profile_id;
        
        INSERT INTO expenses (
            payroll_id,
            category,
            description,
            amount,
            expense_date,
            status,
            payment_mode
        ) VALUES (
            r.id,
            'salary',
            'Salary Paid - ' || coalesce(emp_name, 'Employee') || ' - ' || r.month || '/' || r.year,
            r.net,
            (coalesce(r.payment_date, current_date))::date,
            'approved',
            'neft'
        );
    END LOOP;
END;
$$;


-- 2. Backfill Past Admission Fees into Payments (Income)
-- If a student has 'amount_paid' > 0, but no payment records exist for them,
-- we generate a one-time "Backfilled Admission Fee" payment row to reflect in the Ledger.
DO $$
DECLARE
    s RECORD;
BEGIN
    FOR s IN (
        SELECT * FROM students 
        WHERE amount_paid > 0 
        AND NOT EXISTS (SELECT 1 FROM payments WHERE student_id = students.id OR lead_id = students.lead_id)
    ) LOOP
        INSERT INTO payments (
            lead_id,
            student_id,
            amount,
            payment_mode,
            payment_date,
            notes,
            recorded_by
        ) VALUES (
            s.lead_id,
            s.id,
            s.amount_paid,
            'cash', -- Defaulting to cash for old records without payment mode tracking
            s.enrollment_date,
            'Backfilled Admission Fee',
            (SELECT id FROM profiles WHERE role = 'admin' LIMIT 1)
        );
    END LOOP;
END;
$$;


-- ────────────────────────────────────────────────────────────
-- MIGRATION: 025_add_guardian_name_to_students.sql
-- ────────────────────────────────────────────────────────────
-- Add guardian_name to students
ALTER TABLE students ADD COLUMN IF NOT EXISTS guardian_name text;


-- ────────────────────────────────────────────────────────────
-- MIGRATION: 026_fix_deletion_policies.sql
-- ────────────────────────────────────────────────────────────
-- Add DELETE policies for leads
DROP POLICY IF EXISTS "Admins can delete any lead" ON leads;
create policy "Admins can delete any lead"
  on leads for delete
  using (
    exists (select 1 from profiles where id = auth.uid() and role = 'admin')
  );

DROP POLICY IF EXISTS "Backend can delete any lead" ON leads;
create policy "Backend can delete any lead"
  on leads for delete
  using (
    exists (select 1 from profiles where id = auth.uid() and role = 'backend')
  );

-- Note: We don't allow telecallers to delete leads usually, but if needed:
-- create policy "Telecallers can delete own leads"
--   on leads for delete
--   using (auth.uid() = assigned_to or auth.uid() = created_by);

-- Ensure students table has explicit delete policies if not already covered by 'ALL'
-- Existing policy in 007_students.sql:
-- create policy "Admin and backend can manage students" on students for all ...
-- This already covers DELETE.

-- Add DELETE policy for lead_activities just in case, though it has cascade delete from leads
DROP POLICY IF EXISTS "Admins can delete activities" ON lead_activities;
create policy "Admins can delete activities"
  on lead_activities for delete
  using (
    exists (select 1 from profiles where id = auth.uid() and role = 'admin')
  );


-- ────────────────────────────────────────────────────────────
-- MIGRATION: 027_add_mode_and_department_to_students.sql
-- ────────────────────────────────────────────────────────────
-- Add mode to leads
alter table leads add column if not exists mode text check (mode in ('attending', 'non-attending'));

-- Add fields to students
alter table students 
add column if not exists mode text check (mode in ('attending', 'non-attending')),
add column if not exists department_id uuid references departments(id) on delete set null,
add column if not exists sub_section_id uuid references department_sub_sections(id) on delete set null;


-- ────────────────────────────────────────────────────────────
-- MIGRATION: 028_fix_lead_conversion_fields.sql
-- ────────────────────────────────────────────────────────────
-- Add missing columns to leads table for department/sub-section
ALTER TABLE leads 
ADD COLUMN IF NOT EXISTS department_id uuid REFERENCES departments(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS sub_section_id uuid REFERENCES department_sub_sections(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS enrollment_date date;

-- Update handle_lead_conversion trigger to include new fields
CREATE OR REPLACE FUNCTION handle_lead_conversion()
RETURNS trigger AS $$
BEGIN
  IF NEW.status = 'converted' AND OLD.status != 'converted' THEN
    INSERT INTO students (
      lead_id, full_name, phone, email,
      course_id, sub_course_id, assigned_counsellor,
      total_fee, amount_paid, enrollment_date,
      mode, department_id, sub_section_id
    ) VALUES (
      NEW.id, NEW.full_name, NEW.phone, NEW.email,
      NEW.course_id, NEW.sub_course_id, NEW.assigned_to,
      NEW.total_fee, NEW.amount_paid, COALESCE(NEW.enrollment_date, CURRENT_DATE),
      NEW.mode, NEW.department_id, NEW.sub_section_id
    )
    ON CONFLICT (lead_id) DO UPDATE SET
      mode = EXCLUDED.mode,
      department_id = EXCLUDED.department_id,
      sub_section_id = EXCLUDED.sub_section_id,
      enrollment_date = EXCLUDED.enrollment_date;
    
    NEW.converted_at = now();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- ────────────────────────────────────────────────────────────
-- MIGRATION: 028a_lead_form_fields.sql
-- ────────────────────────────────────────────────────────────
-- lead_form_fields: config table for the dynamic lead form
-- (was created out-of-band in the original project; recreated here so
-- migrations 029/030 that upsert into it can run on a fresh database)

create table if not exists lead_form_fields (
  id uuid primary key default gen_random_uuid(),
  field_key text not null unique,
  label text not null,
  field_type text not null default 'text',
  is_required boolean not null default false,
  is_active boolean not null default true,
  is_system boolean not null default false,
  options jsonb,
  display_order integer not null default 0,
  created_at timestamptz not null default now()
);

alter table lead_form_fields enable row level security;

DROP POLICY IF EXISTS "Authenticated can read form fields" ON lead_form_fields;
create policy "Authenticated can read form fields"
  on lead_form_fields for select
  using (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Authenticated can manage form fields" ON lead_form_fields;
create policy "Authenticated can manage form fields"
  on lead_form_fields for all
  using (auth.role() = 'authenticated');

-- Seed the standard system fields used by the lead form
insert into lead_form_fields (field_key, label, field_type, is_required, is_active, is_system, display_order) values
  ('full_name',          'Full Name',            'text',   true,  true, true, 10),
  ('phone',              'Phone',                'phone',  true,  true, true, 20),
  ('email',              'Email',                'email',  false, true, true, 30),
  ('city',               'City',                 'text',   false, true, true, 40),
  ('state',              'State',                'text',   false, true, true, 50),
  ('source',             'Source',               'select', false, true, true, 60),
  ('status',             'Status',               'select', false, true, true, 70),
  ('course_id',          'Course',               'select', false, true, true, 80),
  ('sub_course_id',      'Sub Course',           'select', false, true, true, 90),
  ('session_id',         'Session',              'select', false, true, true, 95),
  ('assigned_to',        'Assigned To',          'select', false, true, true, 140),
  ('next_followup_date', 'Next Follow-up Date',  'date',   false, true, true, 150),
  ('next_followup_time', 'Next Follow-up Time',  'text',   false, true, true, 160),
  ('total_fee',          'Total Fee',            'number', false, true, true, 170),
  ('amount_paid',        'Amount Paid',          'number', false, true, true, 180),
  ('notes',              'Notes',                'textarea', false, true, true, 190)
on conflict (field_key) do nothing;


-- ────────────────────────────────────────────────────────────
-- MIGRATION: 029_register_new_lead_fields.sql
-- ────────────────────────────────────────────────────────────
-- Ensure new fields exist and are active in lead_form_fields
INSERT INTO lead_form_fields (field_key, label, field_type, is_required, is_active, is_system, display_order)
VALUES 
  ('mode', 'Mode (Attending/Non-attending)', 'select', false, true, true, 100),
  ('department_id', 'Department', 'select', false, true, true, 110),
  ('sub_section_id', 'University/Board', 'select', false, true, true, 120),
  ('enrollment_date', 'Expected Enrollment Date', 'date', false, true, true, 130)
ON CONFLICT (field_key) DO UPDATE SET 
  is_active = true,
  is_system = true;


-- ────────────────────────────────────────────────────────────
-- MIGRATION: 030_register_fee_fields.sql
-- ────────────────────────────────────────────────────────────
-- Ensure amount_paid exists and is active in lead_form_fields
INSERT INTO lead_form_fields (field_key, label, field_type, is_required, is_active, is_system, display_order)
VALUES 
  ('total_fee', 'Total Fee', 'number', false, true, true, 200),
  ('amount_paid', 'Amount Paid', 'number', false, true, true, 210)
ON CONFLICT (field_key) DO UPDATE SET 
  is_active = true,
  is_system = true;


-- ────────────────────────────────────────────────────────────
-- MIGRATION: 031_income_delete_policy.sql
-- ────────────────────────────────────────────────────────────
-- 1. Add DELETE policy for payments
DROP POLICY IF EXISTS "Admin and finance can delete payments" ON payments;
CREATE POLICY "Admin and finance can delete payments"
  ON payments FOR DELETE
  USING (
    exists (select 1 from profiles where id = auth.uid() and role in ('admin', 'finance'))
  );

-- 2. Update trigger to handle INSERT, UPDATE, and DELETE
CREATE OR REPLACE FUNCTION handle_payment_change()
RETURNS trigger AS $$
DECLARE
  target_id uuid;
BEGIN
  -- Determine which lead_id to update (NEW for insert/update, OLD for delete)
  target_id := COALESCE(NEW.lead_id, OLD.lead_id);
  
  IF target_id IS NOT NULL THEN
    -- Update amount_paid in leads
    UPDATE leads SET
      amount_paid = (SELECT COALESCE(SUM(amount), 0) FROM payments WHERE lead_id = target_id)
    WHERE id = target_id;

    -- Update amount_paid in students
    UPDATE students SET
      amount_paid = (SELECT COALESCE(SUM(amount), 0) FROM payments WHERE lead_id = target_id)
    WHERE lead_id = target_id;
  END IF;

  RETURN NULL; -- result is ignored for AFTER triggers
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Replace old insert-only trigger with the new one
DROP TRIGGER IF EXISTS on_payment_inserted ON payments;

DROP TRIGGER IF EXISTS on_payment_changed ON payments;
CREATE TRIGGER on_payment_changed
  AFTER INSERT OR UPDATE OR DELETE ON payments
  FOR EACH ROW EXECUTE PROCEDURE handle_payment_change();


-- ────────────────────────────────────────────────────────────
-- MIGRATION: 032_add_session_to_students.sql
-- ────────────────────────────────────────────────────────────
-- Add session_id to students table
ALTER TABLE students 
ADD COLUMN IF NOT EXISTS session_id uuid REFERENCES sessions(id) ON DELETE SET NULL;

-- Update handle_lead_conversion function to include session_id
CREATE OR REPLACE FUNCTION handle_lead_conversion()
RETURNS trigger AS $$
BEGIN
  IF NEW.status = 'converted' AND OLD.status != 'converted' THEN
    INSERT INTO students (
      lead_id, full_name, phone, email,
      course_id, sub_course_id, assigned_counsellor,
      total_fee, amount_paid, enrollment_date,
      mode, department_id, sub_section_id, session_id
    ) VALUES (
      NEW.id, NEW.full_name, NEW.phone, NEW.email,
      NEW.course_id, NEW.sub_course_id, NEW.assigned_to,
      NEW.total_fee, NEW.amount_paid, COALESCE(NEW.enrollment_date, CURRENT_DATE),
      NEW.mode, NEW.department_id, NEW.sub_section_id, NEW.session_id
    )
    ON CONFLICT (lead_id) DO UPDATE SET
      mode = EXCLUDED.mode,
      department_id = EXCLUDED.department_id,
      sub_section_id = EXCLUDED.sub_section_id,
      enrollment_date = EXCLUDED.enrollment_date;
      -- session_id is usually set during initial insert, if updating we maintain it
    
    NEW.converted_at = now();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- ────────────────────────────────────────────────────────────
-- MIGRATION: 033_robust_payment_sync.sql
-- ────────────────────────────────────────────────────────────
-- Robust trigger to sync amount_paid from payments to leads and students
CREATE OR REPLACE FUNCTION handle_payment_change()
RETURNS trigger AS $$
DECLARE
    target_lead_id uuid;
    target_student_id uuid;
BEGIN
    -- Determine which lead/student to update
    IF TG_OP = 'DELETE' THEN
        target_lead_id := OLD.lead_id;
        target_student_id := OLD.student_id;
    ELSE
        target_lead_id := NEW.lead_id;
        target_student_id := NEW.student_id;
    END IF;

    -- Update Leads
    IF target_lead_id IS NOT NULL THEN
        UPDATE leads SET
            amount_paid = (SELECT COALESCE(SUM(amount), 0) FROM payments WHERE lead_id = target_lead_id)
        WHERE id = target_lead_id;
    END IF;

    -- Update Students (by student_id or lead_id)
    IF target_student_id IS NOT NULL THEN
        UPDATE students SET
            amount_paid = (SELECT COALESCE(SUM(amount), 0) FROM payments WHERE student_id = target_student_id)
        WHERE id = target_student_id;
    ELSIF target_lead_id IS NOT NULL THEN
        UPDATE students SET
            amount_paid = (SELECT COALESCE(SUM(amount), 0) FROM payments WHERE lead_id = target_lead_id)
        WHERE lead_id = target_lead_id;
    END IF;

    IF TG_OP = 'DELETE' THEN
        RETURN OLD;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Re-apply trigger to payments table
DROP TRIGGER IF EXISTS on_payment_inserted ON payments;
DROP TRIGGER IF EXISTS on_payment_changed ON payments;

DROP TRIGGER IF EXISTS on_payment_changed ON payments;
CREATE TRIGGER on_payment_changed
AFTER INSERT OR UPDATE OR DELETE ON payments
FOR EACH ROW EXECUTE PROCEDURE handle_payment_change();

-- Backfill: Ensure all students/leads are synced
UPDATE students s SET amount_paid = (SELECT COALESCE(SUM(amount), 0) FROM payments WHERE student_id = s.id OR lead_id = s.lead_id);
UPDATE leads l SET amount_paid = (SELECT COALESCE(SUM(amount), 0) FROM payments WHERE lead_id = l.id);


-- ────────────────────────────────────────────────────────────
-- MIGRATION: 034_employee_salary_cycle.sql
-- ────────────────────────────────────────────────────────────
-- Add salary_cycle_start_day to employees table
ALTER TABLE employees ADD COLUMN IF NOT EXISTS salary_cycle_start_day integer DEFAULT 1 CHECK (salary_cycle_start_day BETWEEN 1 AND 31);

-- Backfill existing employees to start on the 1st
UPDATE employees SET salary_cycle_start_day = 1 WHERE salary_cycle_start_day IS NULL;

-- Add leave_deduction to payroll
ALTER TABLE payroll ADD COLUMN IF NOT EXISTS leave_deduction numeric(12,2) DEFAULT 0;


-- ────────────────────────────────────────────────────────────
-- MIGRATION: 035_role_restructuring.sql
-- ────────────────────────────────────────────────────────────
-- Restructure roles: admin, lead, backend
-- 1. Update existing data
UPDATE profiles SET role = 'lead' WHERE role = 'telecaller';
UPDATE profiles SET role = 'backend' WHERE role = 'finance';

-- 2. Update check constraint on profiles table
-- First, find the name of the existing constraint if possible, but we can also just drop and recreate if we knew the name.
-- Alternatively, we can use a more generic approach:
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_role_check;
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_role_check;
ALTER TABLE profiles ADD CONSTRAINT profiles_role_check CHECK (role IN ('admin', 'lead', 'backend'));

-- 3. Update existing policies that might explicitly mention old roles (optional, but good for completeness)
-- Most policies use 'admin' which is unchanged.
-- Let's check if any use 'telecaller' or 'finance'.


-- ────────────────────────────────────────────────────────────
-- MIGRATION: 036_fix_role_references.sql
-- ────────────────────────────────────────────────────────────
-- Fix RLS policies in leads table to use 'lead' instead of 'telecaller'
DROP POLICY IF EXISTS "Telecaller and admin can insert leads" ON leads;
DROP POLICY IF EXISTS "Lead and admin can insert leads" ON leads;
CREATE POLICY "Lead and admin can insert leads"
  ON leads FOR INSERT
  WITH CHECK (
    exists (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'lead', 'backend'))
  );

DROP POLICY IF EXISTS "Admin and telecaller can update own leads" ON leads;
DROP POLICY IF EXISTS "Admin and lead can update own leads" ON leads;
CREATE POLICY "Admin and lead can update own leads"
  ON leads FOR UPDATE
  USING (
    exists (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
    OR auth.uid() = assigned_to
  );

DROP POLICY IF EXISTS "Telecaller can view own leads" ON leads;
DROP POLICY IF EXISTS "Lead can view own leads" ON leads;
CREATE POLICY "Lead can view own leads"
  ON leads FOR SELECT
  USING (
    auth.uid() = assigned_to OR auth.uid() = created_by
  );

-- Update students table RLS for consistency (removing old 'finance' role reference)
DROP POLICY IF EXISTS "Admin and backend can view all students" ON students;
DROP POLICY IF EXISTS "Admin, backend and lead can view students" ON students;
CREATE POLICY "Admin, backend and lead can view students"
  ON students FOR SELECT
  USING (
    exists (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'backend', 'lead'))
  );

-- Fix profiles check constraint (ensuring it's up to date)
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_role_check;
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_role_check;
ALTER TABLE profiles ADD CONSTRAINT profiles_role_check CHECK (role IN ('admin', 'lead', 'backend'));


-- ────────────────────────────────────────────────────────────
-- MIGRATION: 037_fix_expenses_rls.sql
-- ────────────────────────────────────────────────────────────
-- Fix expenses RLS: replace 'finance' role (removed) with 'backend', add 'backend' to update policy
DROP POLICY IF EXISTS "Finance and admin can view all expenses" ON expenses;
DROP POLICY IF EXISTS "Admin and backend can view all expenses" ON expenses;
CREATE POLICY "Admin and backend can view all expenses"
  ON expenses FOR SELECT
  USING (
    exists (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'backend'))
  );

DROP POLICY IF EXISTS "Finance and admin can update expenses" ON expenses;
DROP POLICY IF EXISTS "Admin and backend can update expenses" ON expenses;
CREATE POLICY "Admin and backend can update expenses"
  ON expenses FOR UPDATE
  USING (
    exists (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'backend'))
  );

-- Also allow all authenticated users to view their own submitted expenses
DROP POLICY IF EXISTS "Users can view own expenses" ON expenses;
CREATE POLICY "Users can view own expenses"
  ON expenses FOR SELECT
  USING (submitted_by = auth.uid());

-- Allow admin and backend to delete expenses
DROP POLICY IF EXISTS "Admin and backend can delete expenses" ON expenses;
CREATE POLICY "Admin and backend can delete expenses"
  ON expenses FOR DELETE
  USING (
    exists (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'backend'))
  );


-- ────────────────────────────────────────────────────────────
-- MIGRATION: 038_fix_payroll_rls.sql
-- ────────────────────────────────────────────────────────────
-- Allow backend role to manage payroll (view, update status)
DROP POLICY IF EXISTS "Admins can manage payroll" ON payroll;
DROP POLICY IF EXISTS "Admin and backend can manage payroll" ON payroll;
CREATE POLICY "Admin and backend can manage payroll"
  ON payroll FOR ALL
  USING (
    exists (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'backend'))
  );


-- ────────────────────────────────────────────────────────────
-- MIGRATION: 039_backend_hrms_rls.sql
-- ────────────────────────────────────────────────────────────
-- Allow backend to view and manage employees
DROP POLICY IF EXISTS "Admins can manage employees" ON employees;
DROP POLICY IF EXISTS "Admin can manage employees" ON employees;
CREATE POLICY "Admin can manage employees"
  ON employees FOR ALL
  USING (
    exists (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

DROP POLICY IF EXISTS "Backend can view employees" ON employees;
CREATE POLICY "Backend can view employees"
  ON employees FOR SELECT
  USING (
    exists (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'backend')
  );

-- Allow backend to manage attendance
ALTER TABLE attendance ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can manage attendance" ON attendance;
DROP POLICY IF EXISTS "Admin and backend can manage attendance" ON attendance;
CREATE POLICY "Admin and backend can manage attendance"
  ON attendance FOR ALL
  USING (
    exists (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'backend'))
  );

DROP POLICY IF EXISTS "Employees can view own attendance" ON attendance;
CREATE POLICY "Employees can view own attendance"
  ON attendance FOR SELECT
  USING (
    exists (SELECT 1 FROM employees WHERE id = employee_id AND profile_id = auth.uid())
  );


-- ────────────────────────────────────────────────────────────
-- MIGRATION: 040_apply_pending_rls.sql
-- ────────────────────────────────────────────────────────────
-- ============================================================
-- Migration 040: Apply all pending RLS fixes
-- Run this entire script in Supabase SQL Editor
-- ============================================================

-- ------------------------------------------------------------
-- 1. EXPENSES: fix roles (finance→backend) + add DELETE policy
-- ------------------------------------------------------------
DROP POLICY IF EXISTS "Finance and admin can view all expenses" ON expenses;
DROP POLICY IF EXISTS "Admin and backend can view all expenses" ON expenses;
CREATE POLICY "Admin and backend can view all expenses"
  ON expenses FOR SELECT
  USING (
    exists (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'backend'))
  );

DROP POLICY IF EXISTS "Finance and admin can update expenses" ON expenses;
DROP POLICY IF EXISTS "Admin and backend can update expenses" ON expenses;
CREATE POLICY "Admin and backend can update expenses"
  ON expenses FOR UPDATE
  USING (
    exists (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'backend'))
  );

DROP POLICY IF EXISTS "Users can view own expenses" ON expenses;
CREATE POLICY "Users can view own expenses"
  ON expenses FOR SELECT
  USING (submitted_by = auth.uid());

DROP POLICY IF EXISTS "Admin and backend can delete expenses" ON expenses;
CREATE POLICY "Admin and backend can delete expenses"
  ON expenses FOR DELETE
  USING (
    exists (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'backend'))
  );

-- ------------------------------------------------------------
-- 2. PAYROLL: allow backend to manage payroll (not just admin)
-- ------------------------------------------------------------
DROP POLICY IF EXISTS "Admins can manage payroll" ON payroll;
DROP POLICY IF EXISTS "Admin and backend can manage payroll" ON payroll;
CREATE POLICY "Admin and backend can manage payroll"
  ON payroll FOR ALL
  USING (
    exists (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'backend'))
  );

-- ------------------------------------------------------------
-- 3. EMPLOYEES: allow backend to view employees
-- ------------------------------------------------------------
DROP POLICY IF EXISTS "Admins can manage employees" ON employees;
DROP POLICY IF EXISTS "Admin can manage employees" ON employees;
CREATE POLICY "Admin can manage employees"
  ON employees FOR ALL
  USING (
    exists (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

DROP POLICY IF EXISTS "Backend can view employees" ON employees;
CREATE POLICY "Backend can view employees"
  ON employees FOR SELECT
  USING (
    exists (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'backend')
  );

-- ------------------------------------------------------------
-- 4. ATTENDANCE: allow backend to manage attendance
-- ------------------------------------------------------------
ALTER TABLE attendance ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can manage attendance" ON attendance;
DROP POLICY IF EXISTS "Admin and backend can manage attendance" ON attendance;
CREATE POLICY "Admin and backend can manage attendance"
  ON attendance FOR ALL
  USING (
    exists (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'backend'))
  );

DROP POLICY IF EXISTS "Employees can view own attendance" ON attendance;
CREATE POLICY "Employees can view own attendance"
  ON attendance FOR SELECT
  USING (
    exists (SELECT 1 FROM employees WHERE id = employee_id AND profile_id = auth.uid())
  );


-- ────────────────────────────────────────────────────────────
-- MIGRATION: 041_add_housekeeping_role.sql
-- ────────────────────────────────────────────────────────────
-- Add 'housekeeping' as a valid role
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_role_check;
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_role_check;
ALTER TABLE profiles ADD CONSTRAINT profiles_role_check
  CHECK (role IN ('admin', 'lead', 'backend', 'housekeeping'));


-- ────────────────────────────────────────────────────────────
-- MIGRATION: 041_fix_leads_rls.sql
-- ────────────────────────────────────────────────────────────
-- Fix leads RLS: allow backend to update/transfer leads + ensure telecaller sees assigned leads

-- 1. UPDATE policy: add backend role (currently only admin + assigned user can update)
DROP POLICY IF EXISTS "Admin and telecaller can update own leads" ON leads;
DROP POLICY IF EXISTS "Admin and lead can update own leads" ON leads;
DROP POLICY IF EXISTS "Admin and backend can update leads" ON leads;
CREATE POLICY "Admin and backend can update leads"
  ON leads FOR UPDATE
  USING (
    exists (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'backend'))
    OR auth.uid() = assigned_to
  );

-- 2. SELECT: make sure lead role users can see their assigned leads
DROP POLICY IF EXISTS "Telecaller can view own leads" ON leads;
DROP POLICY IF EXISTS "Lead can view own leads" ON leads;
DROP POLICY IF EXISTS "Lead can view assigned leads" ON leads;
CREATE POLICY "Lead can view assigned leads"
  ON leads FOR SELECT
  USING (
    auth.uid() = assigned_to
  );

-- 3. DELETE: only admin/backend can delete leads
DROP POLICY IF EXISTS "Admin can delete leads" ON leads;
DROP POLICY IF EXISTS "Admin and backend can delete leads" ON leads;
CREATE POLICY "Admin and backend can delete leads"
  ON leads FOR DELETE
  USING (
    exists (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'backend'))
  );


-- ────────────────────────────────────────────────────────────
-- MIGRATION: 042_fix_all_roles_and_leads_rls.sql
-- ────────────────────────────────────────────────────────────
-- ============================================================
-- CRITICAL: Run this in Supabase SQL Editor immediately
-- Fixes role names + leads RLS so telecallers see only their leads
-- ============================================================

-- STEP 1: Rename old roles to new names
UPDATE profiles SET role = 'lead' WHERE role = 'telecaller';
UPDATE profiles SET role = 'backend' WHERE role = 'finance';

-- STEP 2: Update profiles check constraint
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_role_check;
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_role_check;
ALTER TABLE profiles ADD CONSTRAINT profiles_role_check
  CHECK (role IN ('admin', 'lead', 'backend'));

-- STEP 3: Fix leads RLS policies

-- Remove old policies
DROP POLICY IF EXISTS "Admin and backend can view all leads" ON leads;
DROP POLICY IF EXISTS "Telecaller can view own leads" ON leads;
DROP POLICY IF EXISTS "Lead can view own leads" ON leads;
DROP POLICY IF EXISTS "Lead can view assigned leads" ON leads;
DROP POLICY IF EXISTS "Admin and telecaller can update own leads" ON leads;
DROP POLICY IF EXISTS "Admin and lead can update own leads" ON leads;
DROP POLICY IF EXISTS "Admin and backend can update leads" ON leads;
DROP POLICY IF EXISTS "Telecaller and admin can insert leads" ON leads;
DROP POLICY IF EXISTS "Lead and admin can insert leads" ON leads;
DROP POLICY IF EXISTS "Admin can delete leads" ON leads;
DROP POLICY IF EXISTS "Admin and backend can delete leads" ON leads;

-- Recreate clean policies
DROP POLICY IF EXISTS "Admin and backend can view all leads" ON leads;
CREATE POLICY "Admin and backend can view all leads"
  ON leads FOR SELECT
  USING (
    exists (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'backend'))
  );

DROP POLICY IF EXISTS "Lead can view assigned leads" ON leads;
CREATE POLICY "Lead can view assigned leads"
  ON leads FOR SELECT
  USING (
    auth.uid() = assigned_to
  );

DROP POLICY IF EXISTS "Admin and backend can insert leads" ON leads;
CREATE POLICY "Admin and backend can insert leads"
  ON leads FOR INSERT
  WITH CHECK (
    exists (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'backend', 'lead'))
  );

DROP POLICY IF EXISTS "Admin and backend can update leads" ON leads;
CREATE POLICY "Admin and backend can update leads"
  ON leads FOR UPDATE
  USING (
    exists (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'backend'))
    OR auth.uid() = assigned_to
  );

DROP POLICY IF EXISTS "Admin and backend can delete leads" ON leads;
CREATE POLICY "Admin and backend can delete leads"
  ON leads FOR DELETE
  USING (
    exists (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'backend'))
  );


-- ────────────────────────────────────────────────────────────
-- MIGRATION: 043_update_lead_status_constraint.sql
-- ────────────────────────────────────────────────────────────
-- Migration 043: Update leads status CHECK constraint to include new status values
-- Old: 'new','contacted','interested','counselled','application_sent','converted','cold','lost'
-- New: adds 'document_received','dnp','switch_off','not_reachable' and removes 'application_sent','cold'

-- Step 1: Migrate existing rows with old status values
UPDATE leads SET status = 'document_received' WHERE status = 'application_sent';
UPDATE leads SET status = 'dnp' WHERE status = 'cold';

-- Step 2: Drop the old CHECK constraint
ALTER TABLE leads DROP CONSTRAINT IF EXISTS leads_status_check;

-- Step 3: Recreate with new valid status values
ALTER TABLE leads DROP CONSTRAINT IF EXISTS leads_status_check;
ALTER TABLE leads
  ADD CONSTRAINT leads_status_check CHECK (status IN (
    'new',
    'contacted',
    'interested',
    'counselled',
    'document_received',
    'converted',
    'lost',
    'dnp',
    'switch_off',
    'not_reachable'
  ));


-- ────────────────────────────────────────────────────────────
-- MIGRATION: 044_add_guardian_contact_to_students.sql
-- ────────────────────────────────────────────────────────────
-- Add guardian phone and relationship fields to students
ALTER TABLE students ADD COLUMN IF NOT EXISTS guardian_phone TEXT;
ALTER TABLE students ADD COLUMN IF NOT EXISTS guardian_relationship TEXT;


-- ────────────────────────────────────────────────────────────
-- MIGRATION: 044_department_litigations.sql
-- ────────────────────────────────────────────────────────────
-- Department litigation tracking system

-- Add dept_fund column to departments (manually updated balance)
ALTER TABLE departments ADD COLUMN IF NOT EXISTS dept_fund NUMERIC(12,2) DEFAULT 0;

-- Create department_litigations table
CREATE TABLE IF NOT EXISTS department_litigations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  department_id UUID NOT NULL REFERENCES departments(id) ON DELETE CASCADE,
  sub_section_id UUID REFERENCES department_sub_sections(id) ON DELETE SET NULL,
  session_id UUID REFERENCES sessions(id) ON DELETE SET NULL,
  student_name TEXT NOT NULL,
  father_name TEXT,
  phone TEXT,
  litigation_amount NUMERIC(12,2) NOT NULL DEFAULT 0,
  amount_paid NUMERIC(12,2) NOT NULL DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE department_litigations ENABLE ROW LEVEL SECURITY;

-- Policies
DROP POLICY IF EXISTS "Authenticated users can view litigations" ON department_litigations;
CREATE POLICY "Authenticated users can view litigations"
  ON department_litigations FOR SELECT
  USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Admins can manage litigations" ON department_litigations;
CREATE POLICY "Admins can manage litigations"
  ON department_litigations FOR ALL
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

-- Updated_at trigger
CREATE OR REPLACE FUNCTION update_litigation_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS litigation_updated_at ON department_litigations;
CREATE TRIGGER litigation_updated_at
  BEFORE UPDATE ON department_litigations
  FOR EACH ROW EXECUTE FUNCTION update_litigation_updated_at();


-- ────────────────────────────────────────────────────────────
-- MIGRATION: 045_update_mode_constraint.sql
-- ────────────────────────────────────────────────────────────
DO $$
DECLARE
    constraint_name text;
BEGIN
    SELECT conname INTO constraint_name
    FROM pg_constraint
    WHERE conrelid = 'leads'::regclass
      AND pg_get_constraintdef(oid) LIKE '%mode%';

    IF constraint_name IS NOT NULL THEN
        EXECUTE 'ALTER TABLE leads DROP CONSTRAINT ' || quote_ident(constraint_name);
    END IF;
END $$;

ALTER TABLE leads DROP CONSTRAINT IF EXISTS leads_mode_check;
ALTER TABLE leads ADD CONSTRAINT leads_mode_check CHECK (mode IN ('attending', 'non-attending', 'regular', 'distance', 'online'));

DO $$
DECLARE
    constraint_name text;
BEGIN
    SELECT conname INTO constraint_name
    FROM pg_constraint
    WHERE conrelid = 'students'::regclass
      AND pg_get_constraintdef(oid) LIKE '%mode%';

    IF constraint_name IS NOT NULL THEN
        EXECUTE 'ALTER TABLE students DROP CONSTRAINT ' || quote_ident(constraint_name);
    END IF;
END $$;

ALTER TABLE students DROP CONSTRAINT IF EXISTS students_mode_check;
ALTER TABLE students ADD CONSTRAINT students_mode_check CHECK (mode IN ('attending', 'non-attending', 'regular', 'distance', 'online'));


-- ────────────────────────────────────────────────────────────
-- MIGRATION: 046_litigation_enhancements.sql
-- ────────────────────────────────────────────────────────────
-- Litigation enhancements: record_type, refund, payment tracker, dropped students

-- Add record_type (litigation vs debt)
ALTER TABLE department_litigations ADD COLUMN IF NOT EXISTS record_type TEXT NOT NULL DEFAULT 'litigation';

-- Add amount_refunded
ALTER TABLE department_litigations ADD COLUMN IF NOT EXISTS amount_refunded NUMERIC(12,2) NOT NULL DEFAULT 0;

-- Add student_id link (for dropped students auto-pulled in)
ALTER TABLE department_litigations ADD COLUMN IF NOT EXISTS student_id UUID REFERENCES students(id) ON DELETE SET NULL;

-- Add drop_reason to students
ALTER TABLE students ADD COLUMN IF NOT EXISTS drop_reason TEXT;

-- Create litigation payments table (individual payment history)
CREATE TABLE IF NOT EXISTS litigation_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  litigation_id UUID NOT NULL REFERENCES department_litigations(id) ON DELETE CASCADE,
  amount NUMERIC(12,2) NOT NULL CHECK (amount > 0),
  payment_date DATE NOT NULL DEFAULT CURRENT_DATE,
  payment_mode TEXT,
  receipt_no TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE litigation_payments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated users can view litigation payments" ON litigation_payments;
DROP POLICY IF EXISTS "Admins can manage litigation payments" ON litigation_payments;

DROP POLICY IF EXISTS "Authenticated users can view litigation payments" ON litigation_payments;
CREATE POLICY "Authenticated users can view litigation payments"
  ON litigation_payments FOR SELECT USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Admins can manage litigation payments" ON litigation_payments;
CREATE POLICY "Admins can manage litigation payments"
  ON litigation_payments FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );


-- ────────────────────────────────────────────────────────────
-- MIGRATION: 047_add_metadata_to_leads.sql
-- ────────────────────────────────────────────────────────────
-- Add metadata column to leads table to store extra information from external sources like Meta
ALTER TABLE leads ADD COLUMN IF NOT EXISTS metadata jsonb DEFAULT '{}'::jsonb;

-- Create an index for better performance on jsonb queries if needed later
CREATE INDEX IF NOT EXISTS idx_leads_metadata ON leads USING gin (metadata);


-- ────────────────────────────────────────────────────────────
-- MIGRATION: 048_add_counselor_role_and_leads_rls.sql
-- ────────────────────────────────────────────────────────────
-- Add 'counselor' as a valid role and update leads RLS
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_role_check;
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_role_check;
ALTER TABLE profiles ADD CONSTRAINT profiles_role_check
  CHECK (role IN ('admin', 'lead', 'backend', 'housekeeping', 'counselor'));

DROP POLICY IF EXISTS "Admin and backend can insert leads" ON leads;
DROP POLICY IF EXISTS "Admin, backend, lead, and counselor can insert leads" ON leads;
CREATE POLICY "Admin, backend, lead, and counselor can insert leads"
  ON leads FOR INSERT
  WITH CHECK (
    exists (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'backend', 'lead', 'counselor'))
  );


-- ────────────────────────────────────────────────────────────
-- MIGRATION: 049_add_father_name_to_students.sql
-- ────────────────────────────────────────────────────────────
ALTER TABLE students ADD COLUMN IF NOT EXISTS father_name TEXT;


-- ────────────────────────────────────────────────────────────
-- MIGRATION: 050_add_adjusted_with_to_litigations.sql
-- ────────────────────────────────────────────────────────────
ALTER TABLE department_litigations ADD COLUMN IF NOT EXISTS adjusted_with TEXT;


-- ────────────────────────────────────────────────────────────
-- MIGRATION: 051_add_associate_role.sql
-- ────────────────────────────────────────────────────────────
-- Add 'associate' as a valid role
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_role_check;
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_role_check;
ALTER TABLE profiles ADD CONSTRAINT profiles_role_check
  CHECK (role IN ('admin', 'lead', 'backend', 'housekeeping', 'counselor', 'associate'));


-- ────────────────────────────────────────────────────────────
-- MIGRATION: 052_associates_portal.sql
-- ────────────────────────────────────────────────────────────
-- Associates master table
create table if not exists associates (
  id uuid primary key default gen_random_uuid(),
  -- Basic Info
  name text not null,
  phone text not null,
  father_phone text,
  email text not null unique,
  -- KYC
  aadhar_number text,
  pan_number text,
  -- Current Address
  current_address text,
  current_city text,
  current_state text,
  current_pincode text,
  -- Permanent Address
  permanent_address text,
  permanent_city text,
  permanent_state text,
  permanent_pincode text,
  same_as_current boolean not null default false,
  -- Bank Details
  bank_name text,
  account_number text,
  ifsc_code text,
  account_holder_name text,
  -- Status & Auth
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  associate_code text unique,
  user_id uuid,
  wallet_balance numeric not null default 0,
  rejection_reason text,
  -- Timestamps
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  approved_at timestamptz,
  approved_by uuid
);

-- Wallet transaction log
create table if not exists associate_wallet_txns (
  id uuid primary key default gen_random_uuid(),
  associate_id uuid not null references associates(id) on delete cascade,
  type text not null check (type in ('credit', 'debit')),
  amount numeric not null,
  reason text,
  created_at timestamptz not null default now()
);

-- Per-associate notifications
create table if not exists associate_notifications (
  id uuid primary key default gen_random_uuid(),
  associate_id uuid references associates(id) on delete cascade,
  title text not null,
  message text,
  is_read boolean not null default false,
  created_at timestamptz not null default now()
);

-- Dispatch / kit shipments sent to associates
create table if not exists associate_dispatches (
  id uuid primary key default gen_random_uuid(),
  associate_id uuid not null references associates(id) on delete cascade,
  item_name text not null,
  quantity int not null default 1,
  tracking_number text,
  status text not null default 'processing' check (status in ('processing', 'shipped', 'delivered')),
  dispatched_at timestamptz,
  created_at timestamptz not null default now()
);

-- Link students/leads to the associate who referred them
alter table leads
  add column if not exists referred_by_associate uuid references associates(id);


-- ────────────────────────────────────────────────────────────
-- MIGRATION: 053_wallet_recharge_requests.sql
-- ────────────────────────────────────────────────────────────
create table if not exists wallet_recharge_requests (
  id uuid primary key default gen_random_uuid(),
  associate_id uuid not null references associates(id) on delete cascade,
  amount numeric not null,
  receipt_url text,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  rejection_reason text,
  approved_by uuid,
  created_at timestamptz not null default now(),
  approved_at timestamptz
);


-- ────────────────────────────────────────────────────────────
-- MIGRATION: 054_associate_coordinator.sql
-- ────────────────────────────────────────────────────────────
alter table associates
  add column if not exists coordinator_id uuid references profiles(id),
  add column if not exists coordinator_name text;


-- ────────────────────────────────────────────────────────────
-- MIGRATION: 055_associate_fixes.sql
-- ────────────────────────────────────────────────────────────
-- Run this FULL script in Supabase SQL Editor to set up all associate tables

-- 1. Associates master table
create table if not exists associates (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  phone text not null,
  father_phone text,
  email text not null unique,
  aadhar_number text,
  pan_number text,
  current_address text,
  current_city text,
  current_state text,
  current_pincode text,
  permanent_address text,
  permanent_city text,
  permanent_state text,
  permanent_pincode text,
  same_as_current boolean not null default false,
  bank_name text,
  account_number text,
  ifsc_code text,
  account_holder_name text,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  associate_code text unique,
  user_id uuid,
  wallet_balance numeric not null default 0,
  rejection_reason text,
  coordinator_id uuid references profiles(id),
  coordinator_name text,
  temp_password text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  approved_at timestamptz,
  approved_by uuid
);

-- 2. Wallet transactions
create table if not exists associate_wallet_txns (
  id uuid primary key default gen_random_uuid(),
  associate_id uuid not null references associates(id) on delete cascade,
  type text not null check (type in ('credit', 'debit')),
  amount numeric not null,
  reason text,
  created_at timestamptz not null default now()
);

-- 3. Notifications
create table if not exists associate_notifications (
  id uuid primary key default gen_random_uuid(),
  associate_id uuid references associates(id) on delete cascade,
  title text not null,
  message text,
  is_read boolean not null default false,
  created_at timestamptz not null default now()
);

-- 4. Dispatches
create table if not exists associate_dispatches (
  id uuid primary key default gen_random_uuid(),
  associate_id uuid not null references associates(id) on delete cascade,
  item_name text not null,
  quantity int not null default 1,
  tracking_number text,
  status text not null default 'processing' check (status in ('processing', 'shipped', 'delivered')),
  dispatched_at timestamptz,
  created_at timestamptz not null default now()
);

-- 5. Wallet recharge requests
create table if not exists wallet_recharge_requests (
  id uuid primary key default gen_random_uuid(),
  associate_id uuid not null references associates(id) on delete cascade,
  amount numeric not null,
  receipt_url text,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  rejection_reason text,
  approved_by uuid,
  created_at timestamptz not null default now(),
  approved_at timestamptz
);

-- 6. Add referred_by_associate to leads (if not exists)
alter table leads
  add column if not exists referred_by_associate uuid references associates(id);

-- 7. Add missing columns to existing associates table (if table already existed)
alter table associates
  add column if not exists coordinator_id uuid references profiles(id),
  add column if not exists coordinator_name text,
  add column if not exists temp_password text;


-- ────────────────────────────────────────────────────────────
-- MIGRATION: 056_associate_documents.sql
-- ────────────────────────────────────────────────────────────
-- Add document URL columns to associates table
alter table associates
  add column if not exists aadhar_doc_url text,
  add column if not exists pan_doc_url text,
  add column if not exists cheque_doc_url text;


-- ────────────────────────────────────────────────────────────
-- MIGRATION: 057_fee_structures.sql
-- ────────────────────────────────────────────────────────────
-- Fee structures table
create table if not exists fee_structures (
  id uuid primary key default gen_random_uuid(),
  department_id uuid references departments(id) on delete cascade,
  course_id uuid references courses(id) on delete cascade,
  session_id uuid references sessions(id) on delete cascade,
  actual_fee numeric not null check (actual_fee >= 0),
  basic_percent numeric not null default 100 check (basic_percent >= 0 and basic_percent <= 200),
  standard_percent numeric not null default 100 check (standard_percent >= 0 and standard_percent <= 200),
  premium_percent numeric not null default 100 check (premium_percent >= 0 and premium_percent <= 200),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (department_id, course_id, session_id)
);

alter table fee_structures enable row level security;

-- All authenticated users can view fees (associates, counselors, etc.)
DROP POLICY IF EXISTS "Authenticated users can view fee structures" ON fee_structures;
create policy "Authenticated users can view fee structures"
  on fee_structures for select using (auth.uid() is not null);

-- Only admin and backend can manage fees
DROP POLICY IF EXISTS "Admin and backend can manage fee structures" ON fee_structures;
create policy "Admin and backend can manage fee structures"
  on fee_structures for all using (
    exists (select 1 from profiles where id = auth.uid() and role in ('admin', 'backend'))
  );


-- ────────────────────────────────────────────────────────────
-- MIGRATION: 058_associate_state_district_institution.sql
-- ────────────────────────────────────────────────────────────
alter table associates
  add column if not exists state text,
  add column if not exists district text,
  add column if not exists city text,
  add column if not exists institution_name text,
  add column if not exists institution_address text;


-- ────────────────────────────────────────────────────────────
-- MIGRATION: 059_add_not_interested_status.sql
-- ────────────────────────────────────────────────────────────
-- Add 'not_interested' to leads status CHECK constraint
ALTER TABLE leads DROP CONSTRAINT IF EXISTS leads_status_check;

ALTER TABLE leads DROP CONSTRAINT IF EXISTS leads_status_check;
ALTER TABLE leads
  ADD CONSTRAINT leads_status_check CHECK (status IN (
    'new',
    'contacted',
    'interested',
    'counselled',
    'document_received',
    'converted',
    'lost',
    'dnp',
    'switch_off',
    'not_reachable',
    'not_interested'
  ));


-- ────────────────────────────────────────────────────────────
-- MIGRATION: 060_pending_student_approval.sql
-- ────────────────────────────────────────────────────────────
-- Allow 'pending' as a student status (awaiting admin approval after lead conversion)
ALTER TABLE students DROP CONSTRAINT IF EXISTS students_status_check;
ALTER TABLE students DROP CONSTRAINT IF EXISTS students_status_check;
ALTER TABLE students
  ADD CONSTRAINT students_status_check
  CHECK (status IN ('active', 'completed', 'dropped', 'on_hold', 'pending'));

-- Update trigger: converted leads create students with status='pending' (not active)
CREATE OR REPLACE FUNCTION handle_lead_conversion()
RETURNS trigger AS $$
BEGIN
  IF NEW.status = 'converted' AND OLD.status != 'converted' THEN
    INSERT INTO students (
      lead_id, full_name, phone, email,
      course_id, sub_course_id, assigned_counsellor,
      total_fee, amount_paid, enrollment_date,
      mode, department_id, sub_section_id, status
    ) VALUES (
      NEW.id, NEW.full_name, NEW.phone, NEW.email,
      NEW.course_id, NEW.sub_course_id, NEW.assigned_to,
      NEW.total_fee, NEW.amount_paid, COALESCE(NEW.enrollment_date, CURRENT_DATE),
      NEW.mode, NEW.department_id, NEW.sub_section_id, 'pending'
    )
    ON CONFLICT (lead_id) DO UPDATE SET
      mode          = EXCLUDED.mode,
      department_id = EXCLUDED.department_id,
      sub_section_id = EXCLUDED.sub_section_id,
      enrollment_date = EXCLUDED.enrollment_date,
      status = 'pending';

    NEW.converted_at = now();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- ────────────────────────────────────────────────────────────
-- MIGRATION: 061_task_management.sql
-- ────────────────────────────────────────────────────────────
-- Task management table
CREATE TABLE IF NOT EXISTS tasks (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title            text NOT NULL,
  description      text,
  urgency          text NOT NULL DEFAULT 'medium'
                   CHECK (urgency IN ('low', 'medium', 'high', 'urgent')),
  -- assignee: stored as user_id (auth.users) + denormalized name for display
  assigned_to      uuid NOT NULL,           -- auth.users.id
  assigned_to_name text NOT NULL,
  -- optionally track if assignee is an associate (for associate portal filter)
  assigned_to_associate_id uuid REFERENCES associates(id) ON DELETE SET NULL,
  created_by       uuid NOT NULL,           -- auth.users.id
  created_by_name  text NOT NULL,
  due_date         date NOT NULL,
  reminder_date    date,
  status           text NOT NULL DEFAULT 'pending'
                   CHECK (status IN ('pending', 'in_progress', 'done')),
  rating           int  CHECK (rating BETWEEN 1 AND 5),
  completion_note  text,
  created_at       timestamptz DEFAULT now(),
  updated_at       timestamptz DEFAULT now()
);

-- RLS: any authenticated user can read tasks assigned to them or created by them
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS tasks_select ON tasks;
CREATE POLICY tasks_select ON tasks FOR SELECT
  USING (auth.uid() = assigned_to OR auth.uid() = created_by);

DROP POLICY IF EXISTS tasks_insert ON tasks;
CREATE POLICY tasks_insert ON tasks FOR INSERT
  WITH CHECK (auth.uid() = created_by);

DROP POLICY IF EXISTS tasks_update ON tasks;
CREATE POLICY tasks_update ON tasks FOR UPDATE
  USING (auth.uid() = assigned_to OR auth.uid() = created_by);

DROP POLICY IF EXISTS tasks_delete ON tasks;
CREATE POLICY tasks_delete ON tasks FOR DELETE
  USING (auth.uid() = created_by);

-- Updated_at trigger
CREATE OR REPLACE FUNCTION set_tasks_updated_at()
RETURNS trigger AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS tasks_updated_at ON tasks;
CREATE TRIGGER tasks_updated_at
  BEFORE UPDATE ON tasks
  FOR EACH ROW EXECUTE FUNCTION set_tasks_updated_at();


-- ────────────────────────────────────────────────────────────
-- MIGRATION: 062_notifications.sql
-- ────────────────────────────────────────────────────────────
-- General notifications table (admin-created broadcasts or targeted)
CREATE TABLE IF NOT EXISTS notifications (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title       text NOT NULL,
  message     text NOT NULL,
  type        text NOT NULL DEFAULT 'info'
              CHECK (type IN ('info', 'warning', 'success', 'alert')),
  -- null target_role = broadcast to all
  target_role text,
  created_by  uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at  timestamptz DEFAULT now()
);

-- Track which users have read which notifications
CREATE TABLE IF NOT EXISTS notification_reads (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  notification_id uuid NOT NULL REFERENCES notifications(id) ON DELETE CASCADE,
  user_id         uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  read_at         timestamptz DEFAULT now(),
  UNIQUE (notification_id, user_id)
);

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_reads ENABLE ROW LEVEL SECURITY;

-- Anyone authenticated can read notifications targeted at their role or broadcast
DROP POLICY IF EXISTS notifications_select ON notifications;
CREATE POLICY notifications_select ON notifications FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- Only admin/backend can create
DROP POLICY IF EXISTS notifications_insert ON notifications;
CREATE POLICY notifications_insert ON notifications FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'backend')
    )
  );

DROP POLICY IF EXISTS notification_reads_select ON notification_reads;
CREATE POLICY notification_reads_select ON notification_reads FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS notification_reads_insert ON notification_reads;
CREATE POLICY notification_reads_insert ON notification_reads FOR INSERT
  WITH CHECK (auth.uid() = user_id);


-- ────────────────────────────────────────────────────────────
-- MIGRATION: 063_student_dispatches.sql
-- ────────────────────────────────────────────────────────────
-- Student document dispatch tracking
CREATE TABLE IF NOT EXISTS student_dispatches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_name TEXT NOT NULL,
  enrollment_number TEXT,
  associate_id UUID REFERENCES associates(id) ON DELETE SET NULL,
  document_type TEXT NOT NULL DEFAULT 'marksheet',
  courier TEXT,
  tracking_number TEXT,
  dispatch_date DATE,
  expected_delivery DATE,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending','dispatched','in_transit','delivered','returned','failed')),
  remarks TEXT,
  dispatched_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_student_dispatches_associate ON student_dispatches(associate_id);
CREATE INDEX IF NOT EXISTS idx_student_dispatches_status ON student_dispatches(status);
CREATE INDEX IF NOT EXISTS idx_student_dispatches_created ON student_dispatches(created_at DESC);

ALTER TABLE student_dispatches ENABLE ROW LEVEL SECURITY;

-- Admin/backend/ops can do everything
DROP POLICY IF EXISTS "admin_full_dispatch" ON student_dispatches;
CREATE POLICY "admin_full_dispatch" ON student_dispatches
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin','backend'))
  );

-- Associates can view their own dispatch records
DROP POLICY IF EXISTS "associate_view_own_dispatch" ON student_dispatches;
CREATE POLICY "associate_view_own_dispatch" ON student_dispatches
  FOR SELECT USING (
    associate_id IN (SELECT id FROM associates WHERE user_id = auth.uid())
  );


-- ────────────────────────────────────────────────────────────
-- MIGRATION: 064_dispatch_type.sql
-- ────────────────────────────────────────────────────────────
-- Add dispatch type to student_dispatches
ALTER TABLE student_dispatches
  ADD COLUMN IF NOT EXISTS dispatch_type TEXT NOT NULL DEFAULT 'outbound'
    CHECK (dispatch_type IN ('inbound', 'outbound'));

-- inbound = document received at CareerOptics from university/institute
-- outbound = document dispatched from CareerOptics to student/associate

CREATE INDEX IF NOT EXISTS idx_student_dispatches_type ON student_dispatches(dispatch_type);


-- ────────────────────────────────────────────────────────────
-- MIGRATION: 065_dispatch_student_details.sql
-- ────────────────────────────────────────────────────────────
ALTER TABLE student_dispatches
  ADD COLUMN IF NOT EXISTS student_phone TEXT,
  ADD COLUMN IF NOT EXISTS father_name TEXT;


-- ────────────────────────────────────────────────────────────
-- MIGRATION: 066_student_referred_by_associate.sql
-- ────────────────────────────────────────────────────────────
ALTER TABLE students
  ADD COLUMN IF NOT EXISTS referred_by_associate UUID REFERENCES associates(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_students_referred_by_associate ON students(referred_by_associate);


-- ────────────────────────────────────────────────────────────
-- MIGRATION: 067_attendance_backend_rls.sql
-- ────────────────────────────────────────────────────────────
-- Allow backend role to manage attendance (was admin-only before)
DROP POLICY IF EXISTS "Admins can manage attendance" ON attendance;

DROP POLICY IF EXISTS "Admin and backend can manage attendance" ON attendance;
CREATE POLICY "Admin and backend can manage attendance"
  ON attendance FOR ALL
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'backend'))
  );


-- ────────────────────────────────────────────────────────────
-- MIGRATION: 067_attendance_self_service.sql
-- ────────────────────────────────────────────────────────────
-- GPS coordinates for punch in/out
ALTER TABLE attendance
  ADD COLUMN IF NOT EXISTS punch_in_lat  NUMERIC(10, 7),
  ADD COLUMN IF NOT EXISTS punch_in_lng  NUMERIC(10, 7),
  ADD COLUMN IF NOT EXISTS punch_out_lat NUMERIC(10, 7),
  ADD COLUMN IF NOT EXISTS punch_out_lng NUMERIC(10, 7);

-- Allow employees to insert/update their own attendance row
DROP POLICY IF EXISTS "Employees can upsert own attendance" ON attendance;
CREATE POLICY "Employees can upsert own attendance"
  ON attendance FOR ALL
  USING (
    EXISTS (SELECT 1 FROM employees WHERE id = employee_id AND profile_id = auth.uid())
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM employees WHERE id = employee_id AND profile_id = auth.uid())
  );


-- ────────────────────────────────────────────────────────────
-- MIGRATION: 068_litigation_reason_column.sql
-- ────────────────────────────────────────────────────────────
-- Add missing reason and litigation_type columns to department_litigations
ALTER TABLE department_litigations
  ADD COLUMN IF NOT EXISTS reason TEXT,
  ADD COLUMN IF NOT EXISTS litigation_type TEXT;


-- ────────────────────────────────────────────────────────────
-- MIGRATION: 069_student_portal.sql
-- ────────────────────────────────────────────────────────────
-- Student Portal: credentials, portal data, and all supporting tables

-- 1. Add portal columns to students table
ALTER TABLE students
  ADD COLUMN IF NOT EXISTS portal_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS portal_username TEXT,
  ADD COLUMN IF NOT EXISTS portal_temp_password TEXT,
  ADD COLUMN IF NOT EXISTS portal_active BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS university_name TEXT,
  ADD COLUMN IF NOT EXISTS board_name TEXT,
  ADD COLUMN IF NOT EXISTS father_name TEXT,
  ADD COLUMN IF NOT EXISTS guardian_name TEXT,
  ADD COLUMN IF NOT EXISTS guardian_phone TEXT,
  ADD COLUMN IF NOT EXISTS guardian_relationship TEXT,
  ADD COLUMN IF NOT EXISTS dob DATE,
  ADD COLUMN IF NOT EXISTS gender TEXT CHECK (gender IN ('male','female','other')),
  ADD COLUMN IF NOT EXISTS address TEXT,
  ADD COLUMN IF NOT EXISTS state TEXT,
  ADD COLUMN IF NOT EXISTS pincode TEXT,
  ADD COLUMN IF NOT EXISTS verification_status TEXT NOT NULL DEFAULT 'pending'
    CHECK (verification_status IN ('pending','in_review','verified','rejected')),
  ADD COLUMN IF NOT EXISTS exam_status TEXT NOT NULL DEFAULT 'not_scheduled'
    CHECK (exam_status IN ('not_scheduled','scheduled','completed','result_awaited','passed','failed')),
  ADD COLUMN IF NOT EXISTS result_status TEXT NOT NULL DEFAULT 'awaited'
    CHECK (result_status IN ('awaited','declared','passed','failed','re_appear')),
  ADD COLUMN IF NOT EXISTS admit_card_url TEXT,
  ADD COLUMN IF NOT EXISTS enrollment_card_url TEXT,
  ADD COLUMN IF NOT EXISTS id_card_url TEXT,
  ADD COLUMN IF NOT EXISTS marksheet_url TEXT,
  ADD COLUMN IF NOT EXISTS certificate_url TEXT,
  ADD COLUMN IF NOT EXISTS profile_photo_url TEXT,
  ADD COLUMN IF NOT EXISTS admission_progress INT NOT NULL DEFAULT 0 CHECK (admission_progress BETWEEN 0 AND 100);

CREATE UNIQUE INDEX IF NOT EXISTS idx_students_portal_user ON students(portal_user_id) WHERE portal_user_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_students_portal_active ON students(portal_active);

-- 2. Student notifications (admin broadcasts to specific students or all)
CREATE TABLE IF NOT EXISTS student_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID REFERENCES students(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'info' CHECK (type IN ('info','success','warning','alert')),
  is_read BOOLEAN NOT NULL DEFAULT false,
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_student_notif_student ON student_notifications(student_id);
CREATE INDEX IF NOT EXISTS idx_student_notif_read ON student_notifications(student_id, is_read);

-- 3. Student announcements (visible to all students)
CREATE TABLE IF NOT EXISTS student_announcements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'general' CHECK (type IN ('general','exam','result','fee','urgent')),
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS idx_announcements_active ON student_announcements(is_active, created_at DESC);

-- 4. Student support tickets
CREATE TABLE IF NOT EXISTS student_support_tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  subject TEXT NOT NULL,
  message TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open','in_progress','resolved','closed')),
  priority TEXT NOT NULL DEFAULT 'normal' CHECK (priority IN ('low','normal','high','urgent')),
  admin_reply TEXT,
  replied_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  replied_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_tickets_student ON student_support_tickets(student_id);
CREATE INDEX IF NOT EXISTS idx_tickets_status ON student_support_tickets(status);

-- 5. Study materials
CREATE TABLE IF NOT EXISTS study_materials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  type TEXT NOT NULL DEFAULT 'pdf' CHECK (type IN ('ebook','pdf_notes','syllabus','recorded_class','live_class','other')),
  url TEXT,
  course_id UUID REFERENCES courses(id) ON DELETE SET NULL,
  sub_course_id UUID REFERENCES sub_courses(id) ON DELETE SET NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  uploaded_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_materials_course ON study_materials(course_id, is_active);
CREATE INDEX IF NOT EXISTS idx_materials_type ON study_materials(type, is_active);

-- 6. Student FAQs
CREATE TABLE IF NOT EXISTS student_faqs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'general',
  sort_order INT NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 7. RLS Policies

ALTER TABLE student_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_support_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE study_materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_faqs ENABLE ROW LEVEL SECURITY;

-- Admin/backend can do everything on all student tables
DROP POLICY IF EXISTS "admin_student_notif" ON student_notifications;
CREATE POLICY "admin_student_notif"
  ON student_notifications FOR ALL
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin','backend')));

DROP POLICY IF EXISTS "admin_announcements" ON student_announcements;
CREATE POLICY "admin_announcements"
  ON student_announcements FOR ALL
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin','backend')));

DROP POLICY IF EXISTS "admin_tickets" ON student_support_tickets;
CREATE POLICY "admin_tickets"
  ON student_support_tickets FOR ALL
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin','backend')));

DROP POLICY IF EXISTS "admin_materials" ON study_materials;
CREATE POLICY "admin_materials"
  ON study_materials FOR ALL
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin','backend')));

DROP POLICY IF EXISTS "admin_faqs" ON student_faqs;
CREATE POLICY "admin_faqs"
  ON student_faqs FOR ALL
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin','backend')));

-- Students can see their own notifications
DROP POLICY IF EXISTS "student_own_notif" ON student_notifications;
CREATE POLICY "student_own_notif"
  ON student_notifications FOR SELECT
  USING (student_id IN (SELECT id FROM students WHERE portal_user_id = auth.uid()));

DROP POLICY IF EXISTS "student_mark_notif_read" ON student_notifications;
CREATE POLICY "student_mark_notif_read"
  ON student_notifications FOR UPDATE
  USING (student_id IN (SELECT id FROM students WHERE portal_user_id = auth.uid()));

-- Students can see active announcements
DROP POLICY IF EXISTS "student_view_announcements" ON student_announcements;
CREATE POLICY "student_view_announcements"
  ON student_announcements FOR SELECT
  USING (is_active = true AND (expires_at IS NULL OR expires_at > now()));

-- Students can see and create their own tickets
DROP POLICY IF EXISTS "student_own_tickets" ON student_support_tickets;
CREATE POLICY "student_own_tickets"
  ON student_support_tickets FOR SELECT
  USING (student_id IN (SELECT id FROM students WHERE portal_user_id = auth.uid()));

DROP POLICY IF EXISTS "student_create_tickets" ON student_support_tickets;
CREATE POLICY "student_create_tickets"
  ON student_support_tickets FOR INSERT
  WITH CHECK (student_id IN (SELECT id FROM students WHERE portal_user_id = auth.uid()));

-- Students can see active study materials for their course
DROP POLICY IF EXISTS "student_view_materials" ON study_materials;
CREATE POLICY "student_view_materials"
  ON study_materials FOR SELECT
  USING (
    is_active = true AND (
      course_id IS NULL
      OR course_id IN (SELECT course_id FROM students WHERE portal_user_id = auth.uid() AND course_id IS NOT NULL)
    )
  );

-- Students can see active FAQs
DROP POLICY IF EXISTS "student_view_faqs" ON student_faqs;
CREATE POLICY "student_view_faqs"
  ON student_faqs FOR SELECT
  USING (is_active = true);

-- Students can read their own student record
DROP POLICY IF EXISTS "student_read_own" ON students;
CREATE POLICY "student_read_own"
  ON students FOR SELECT
  USING (portal_user_id = auth.uid());

-- Students can update their own profile photo and contact info
DROP POLICY IF EXISTS "student_update_own_profile" ON students;
CREATE POLICY "student_update_own_profile"
  ON students FOR UPDATE
  USING (portal_user_id = auth.uid())
  WITH CHECK (portal_user_id = auth.uid());

-- Students can read their own payments
DROP POLICY IF EXISTS "student_own_payments" ON payments;
CREATE POLICY "student_own_payments"
  ON payments FOR SELECT
  USING (student_id IN (SELECT id FROM students WHERE portal_user_id = auth.uid()));

-- Students can read their own dispatches
DROP POLICY IF EXISTS "student_own_dispatches" ON student_dispatches;
CREATE POLICY "student_own_dispatches"
  ON student_dispatches FOR SELECT
  USING (
    enrollment_number IN (SELECT enrollment_number FROM students WHERE portal_user_id = auth.uid())
  );

-- Insert some default FAQs
DO $faq$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM student_faqs) THEN
    INSERT INTO student_faqs (question, answer, category, sort_order) VALUES
      ('How do I check my admission status?', 'Go to "My Admission Status" section in the portal to see your complete admission progress including verification, exam, and result status.', 'admission', 1),
      ('How can I download my admit card?', 'Once your admit card is issued, it will appear in the "My Admission Status" section under "Documents". You can download it from there.', 'exam', 2),
      ('Where can I see my payment history?', 'Go to "Accounts" section to view your complete payment history, pending dues, and download receipts.', 'payment', 3),
      ('How do I raise a support ticket?', 'Go to "Help & Support" section and click "Raise a Ticket". Our team will respond within 24-48 hours.', 'support', 4),
      ('How do I update my contact information?', 'Go to "Profile" section and click on "Contact Information" to update your phone number, email, or address.', 'profile', 5)
    ON CONFLICT DO NOTHING;
  END IF;
END $faq$;


-- ────────────────────────────────────────────────────────────
-- MIGRATION: 070_student_uploads.sql
-- ────────────────────────────────────────────────────────────
-- Student-uploaded documents (student submits to admin)
CREATE TABLE IF NOT EXISTS student_uploads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  document_type TEXT NOT NULL,
  file_url TEXT NOT NULL,
  remarks TEXT,
  uploaded_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_student_uploads_student ON student_uploads(student_id, uploaded_at DESC);

ALTER TABLE student_uploads ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "admin_student_uploads" ON student_uploads;
CREATE POLICY "admin_student_uploads"
  ON student_uploads FOR ALL
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin','backend')))
  WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin','backend')));

DROP POLICY IF EXISTS "student_own_uploads_select" ON student_uploads;
CREATE POLICY "student_own_uploads_select"
  ON student_uploads FOR SELECT
  USING (student_id IN (SELECT id FROM students WHERE portal_user_id = auth.uid()));

DROP POLICY IF EXISTS "student_own_uploads_insert" ON student_uploads;
CREATE POLICY "student_own_uploads_insert"
  ON student_uploads FOR INSERT
  WITH CHECK (student_id IN (SELECT id FROM students WHERE portal_user_id = auth.uid()));


-- ────────────────────────────────────────────────────────────
-- MIGRATION: 071_student_notifications_update.sql
-- ────────────────────────────────────────────────────────────
ALTER TABLE student_notifications
  ADD COLUMN IF NOT EXISTS file_url TEXT,
  ADD COLUMN IF NOT EXISTS category TEXT;


-- ────────────────────────────────────────────────────────────
-- MIGRATION: 072_add_student_role_to_profiles.sql
-- ────────────────────────────────────────────────────────────
-- Add 'student' to the allowed roles in profiles table
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_role_check;
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_role_check;
ALTER TABLE profiles ADD CONSTRAINT profiles_role_check
  CHECK (role IN ('admin', 'lead', 'backend', 'housekeeping', 'counselor', 'associate', 'student'));


-- ────────────────────────────────────────────────────────────
-- MIGRATION: 073_associate_portal_full.sql
-- ────────────────────────────────────────────────────────────
-- Associate Resources table (admin uploads, associates download)
CREATE TABLE IF NOT EXISTS associate_resources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  type TEXT NOT NULL DEFAULT 'other'
    CHECK (type IN ('brochure','fee_structure','admission_form','marketing','poster','reel','training','other')),
  url TEXT NOT NULL,
  file_size TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  uploaded_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_assoc_resources_type ON associate_resources(type, is_active);

-- Associate Support Tickets
CREATE TABLE IF NOT EXISTS associate_support_tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  associate_id UUID NOT NULL REFERENCES associates(id) ON DELETE CASCADE,
  subject TEXT NOT NULL,
  message TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'open'
    CHECK (status IN ('open','in_progress','resolved','closed')),
  priority TEXT NOT NULL DEFAULT 'normal'
    CHECK (priority IN ('low','normal','high','urgent')),
  admin_reply TEXT,
  replied_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  replied_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_assoc_tickets_assoc ON associate_support_tickets(associate_id);
CREATE INDEX IF NOT EXISTS idx_assoc_tickets_status ON associate_support_tickets(status);

-- RLS
ALTER TABLE associate_resources ENABLE ROW LEVEL SECURITY;
ALTER TABLE associate_support_tickets ENABLE ROW LEVEL SECURITY;

-- Resources: admins manage, associates read active
DROP POLICY IF EXISTS "admin_assoc_resources" ON associate_resources;
CREATE POLICY "admin_assoc_resources"
  ON associate_resources FOR ALL
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin','backend')));

DROP POLICY IF EXISTS "associate_read_resources" ON associate_resources;
CREATE POLICY "associate_read_resources"
  ON associate_resources FOR SELECT
  USING (
    is_active = true AND
    EXISTS (SELECT 1 FROM associates WHERE user_id = auth.uid())
  );

-- Tickets: associates manage own, admins see all
DROP POLICY IF EXISTS "associate_own_tickets" ON associate_support_tickets;
CREATE POLICY "associate_own_tickets"
  ON associate_support_tickets FOR ALL
  USING (associate_id IN (SELECT id FROM associates WHERE user_id = auth.uid()))
  WITH CHECK (associate_id IN (SELECT id FROM associates WHERE user_id = auth.uid()));

DROP POLICY IF EXISTS "admin_all_tickets" ON associate_support_tickets;
CREATE POLICY "admin_all_tickets"
  ON associate_support_tickets FOR ALL
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin','backend')));

-- Add referred_by_associate to students if not exists (for direct student lookup)
ALTER TABLE students ADD COLUMN IF NOT EXISTS referred_by_associate UUID REFERENCES associates(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_students_assoc ON students(referred_by_associate) WHERE referred_by_associate IS NOT NULL;


-- ────────────────────────────────────────────────────────────
-- MIGRATION: 074_centre_fee_module.sql
-- ────────────────────────────────────────────────────────────
-- Centre Fee Module
-- Tracks actual payments made to boards/universities (separate from student fees)

CREATE TABLE IF NOT EXISTS centre_fee_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE UNIQUE,

  -- Editable fee section
  centre_fee         NUMERIC(12,2),          -- total amount payable to board/university
  amount_paid        NUMERIC(12,2) NOT NULL DEFAULT 0,
  payment_status     TEXT NOT NULL DEFAULT 'pending'
    CHECK (payment_status IN ('paid','partial','pending')),

  -- Last payment details (for quick display)
  last_payment_date  DATE,
  payment_mode       TEXT CHECK (payment_mode IN ('cash','upi','bank_transfer','cheque','demand_draft','other')),
  transaction_id     TEXT,
  remarks            TEXT,

  -- Paid To details
  paid_to_board_name   TEXT,   -- board or university name paid to
  paid_to_person_name  TEXT,   -- individual person name (if applicable)
  account_holder_name  TEXT,
  bank_name            TEXT,
  upi_id               TEXT,
  account_number       TEXT,
  payment_contact      TEXT,

  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  updated_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_cfr_student    ON centre_fee_records(student_id);
CREATE INDEX IF NOT EXISTS idx_cfr_status     ON centre_fee_records(payment_status);

-- Payment history (each individual payment transaction)
CREATE TABLE IF NOT EXISTS centre_fee_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  record_id    UUID NOT NULL REFERENCES centre_fee_records(id) ON DELETE CASCADE,
  amount       NUMERIC(12,2) NOT NULL CHECK (amount > 0),
  payment_date DATE NOT NULL DEFAULT CURRENT_DATE,
  payment_mode TEXT CHECK (payment_mode IN ('cash','upi','bank_transfer','cheque','demand_draft','other')),
  transaction_id TEXT,
  paid_to      TEXT,
  remarks      TEXT,
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_cfp_record ON centre_fee_payments(record_id);

-- RLS
ALTER TABLE centre_fee_records  ENABLE ROW LEVEL SECURITY;
ALTER TABLE centre_fee_payments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "admin_centre_fee_records" ON centre_fee_records;
CREATE POLICY "admin_centre_fee_records"
  ON centre_fee_records FOR ALL
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin','backend')));

DROP POLICY IF EXISTS "admin_centre_fee_payments" ON centre_fee_payments;
CREATE POLICY "admin_centre_fee_payments"
  ON centre_fee_payments FOR ALL
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin','backend')));

-- Trigger: auto-update amount_paid and status when a payment is added
CREATE OR REPLACE FUNCTION update_centre_fee_on_payment()
RETURNS TRIGGER AS $$
DECLARE
  total_paid NUMERIC;
  total_fee  NUMERIC;
BEGIN
  SELECT COALESCE(SUM(amount), 0) INTO total_paid
  FROM centre_fee_payments WHERE record_id = NEW.record_id;

  SELECT COALESCE(centre_fee, 0) INTO total_fee
  FROM centre_fee_records WHERE id = NEW.record_id;

  UPDATE centre_fee_records SET
    amount_paid    = total_paid,
    payment_status = CASE
      WHEN total_paid <= 0           THEN 'pending'
      WHEN total_paid >= total_fee   THEN 'paid'
      ELSE                                'partial'
    END,
    last_payment_date = NEW.payment_date,
    payment_mode      = NEW.payment_mode,
    transaction_id    = NEW.transaction_id,
    updated_at        = now()
  WHERE id = NEW.record_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_centre_fee_payment ON centre_fee_payments;
DROP TRIGGER IF EXISTS trg_centre_fee_payment ON centre_fee_payments;
CREATE TRIGGER trg_centre_fee_payment
  AFTER INSERT ON centre_fee_payments
  FOR EACH ROW EXECUTE FUNCTION update_centre_fee_on_payment();


-- ────────────────────────────────────────────────────────────
-- MIGRATION: 075_mentorship_module.sql
-- ────────────────────────────────────────────────────────────
-- Mentorship Module
-- Track mentorship work assigned by admin to telecallers for specific students

CREATE TABLE IF NOT EXISTS student_mentorships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id    UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  telecaller_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  task_type     TEXT NOT NULL CHECK (task_type IN ('work_assignment', 'practical', 'exam')),
  description   TEXT,
  rating        NUMERIC(3,1) CHECK (rating >= 0 AND rating <= 10),

  -- Admin approval fields
  status           TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'approved', 'rejected')),
  salary_percentage NUMERIC(5,2),   -- % to add to telecaller salary (set by admin on approval)
  admin_remarks    TEXT,
  approved_by      UUID REFERENCES profiles(id) ON DELETE SET NULL,
  approved_at      TIMESTAMPTZ,

  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_sm_student    ON student_mentorships(student_id);
CREATE INDEX IF NOT EXISTS idx_sm_telecaller ON student_mentorships(telecaller_id);
CREATE INDEX IF NOT EXISTS idx_sm_status     ON student_mentorships(status);

ALTER TABLE student_mentorships ENABLE ROW LEVEL SECURITY;

-- Admin / backend: full access
DROP POLICY IF EXISTS "admin_mentorships_all" ON student_mentorships;
CREATE POLICY "admin_mentorships_all"
  ON student_mentorships FOR ALL
  USING (EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'backend')
  ));

-- Telecallers: can read mentorships assigned to them
DROP POLICY IF EXISTS "telecaller_view_own" ON student_mentorships;
CREATE POLICY "telecaller_view_own"
  ON student_mentorships FOR SELECT
  USING (telecaller_id = auth.uid());


-- ────────────────────────────────────────────────────────────
-- MIGRATION: 076_mentorship_assignment.sql
-- ────────────────────────────────────────────────────────────
-- Mentorship Assignment
-- Admin tags a lead (telecaller) to a student; lead does the work from their portal

ALTER TABLE students ADD COLUMN IF NOT EXISTS mentor_telecaller_id UUID REFERENCES profiles(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_students_mentor ON students(mentor_telecaller_id);

-- Leads can read students assigned to them for mentorship
DROP POLICY IF EXISTS "lead_view_mentorship_students" ON students;
CREATE POLICY "lead_view_mentorship_students"
  ON students
  FOR SELECT USING (mentor_telecaller_id = auth.uid());

-- Leads can insert their own mentorship task submissions
DROP POLICY IF EXISTS "lead_insert_mentorship_tasks" ON student_mentorships;
CREATE POLICY "lead_insert_mentorship_tasks"
  ON student_mentorships
  FOR INSERT WITH CHECK (
    telecaller_id = auth.uid()
    AND EXISTS (SELECT 1 FROM students WHERE id = student_id AND mentor_telecaller_id = auth.uid())
  );

-- Leads can read their own submissions
DROP POLICY IF EXISTS "lead_view_own_mentorship_tasks" ON student_mentorships;
CREATE POLICY "lead_view_own_mentorship_tasks"
  ON student_mentorships
  FOR SELECT USING (telecaller_id = auth.uid());


-- ────────────────────────────────────────────────────────────
-- MIGRATION: 077_enrollment_number_hd_format.sql
-- ────────────────────────────────────────────────────────────
-- Change enrollment number default from ENR- prefix to HD- prefix
ALTER TABLE students
  ALTER COLUMN enrollment_number
  SET DEFAULT 'HD-' || floor(random() * 900000 + 100000)::text;

-- Update existing ENR-XXXXXXX or ENR-XXXXXXX(letter) → HD-XXXXXXX (digits only)
UPDATE students
SET enrollment_number = 'HD-' || regexp_replace(enrollment_number, '^ENR-([0-9]+).*$', '\1')
WHERE enrollment_number ~* '^ENR-[0-9]';


-- ────────────────────────────────────────────────────────────
-- MIGRATION: 078_student_referrals.sql
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS student_referrals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  referred_by_student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  referred_by_name TEXT NOT NULL,
  referred_by_enrollment TEXT NOT NULL,
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  interested_in TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'contacted', 'admitted', 'rejected')),
  reward_given BOOLEAN DEFAULT false,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_referrals_student ON student_referrals(referred_by_student_id);

ALTER TABLE student_referrals ENABLE ROW LEVEL SECURITY;

-- Students can insert and view their own referrals
DROP POLICY IF EXISTS "student_insert_referral" ON student_referrals;
CREATE POLICY "student_insert_referral"
  ON student_referrals
  FOR INSERT WITH CHECK (
    referred_by_student_id IN (SELECT id FROM students WHERE portal_user_id = auth.uid())
  );

DROP POLICY IF EXISTS "student_view_own_referrals" ON student_referrals;
CREATE POLICY "student_view_own_referrals"
  ON student_referrals
  FOR SELECT USING (
    referred_by_student_id IN (SELECT id FROM students WHERE portal_user_id = auth.uid())
  );

-- Admin/backend full access
DROP POLICY IF EXISTS "admin_referrals_all" ON student_referrals;
CREATE POLICY "admin_referrals_all"
  ON student_referrals FOR ALL
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'backend')));


-- ────────────────────────────────────────────────────────────
-- MIGRATION: 079_mentorship_records_v2.sql
-- ────────────────────────────────────────────────────────────
-- Mentorship Records v2
-- Add subject_name, amounts, screenshot to student_mentorships
-- Update task_type to include theory and assignment

ALTER TABLE student_mentorships
  DROP CONSTRAINT IF EXISTS student_mentorships_task_type_check;

ALTER TABLE student_mentorships DROP CONSTRAINT IF EXISTS student_mentorships_task_type_check;
ALTER TABLE student_mentorships
  ADD CONSTRAINT student_mentorships_task_type_check
  CHECK (task_type IN ('practical', 'assignment', 'theory', 'work_assignment', 'exam'));

ALTER TABLE student_mentorships
  ADD COLUMN IF NOT EXISTS subject_name TEXT,
  ADD COLUMN IF NOT EXISTS total_amount NUMERIC(10,2),
  ADD COLUMN IF NOT EXISTS student_paid_amount NUMERIC(10,2),
  ADD COLUMN IF NOT EXISTS screenshot_url TEXT;

-- Allow counselors to read their assigned students (same as leads)
DROP POLICY IF EXISTS "counselor_view_mentorship_students" ON students;
CREATE POLICY "counselor_view_mentorship_students"
  ON students
  FOR SELECT USING (mentor_telecaller_id = auth.uid());


-- ────────────────────────────────────────────────────────────
-- MIGRATION: 080_mentorship_mode_status.sql
-- ────────────────────────────────────────────────────────────
-- Mentorship record: managed-by mode + mentor work status
-- managed_by: 'dcw' (CareerOptics-managed, has payment) or 'self' (student self, no payment)
-- work_status: mentor-marked progress of the practical/assignment/theory work

ALTER TABLE student_mentorships
  ADD COLUMN IF NOT EXISTS managed_by  TEXT NOT NULL DEFAULT 'dcw'
    CHECK (managed_by IN ('dcw', 'self')),
  ADD COLUMN IF NOT EXISTS work_status TEXT NOT NULL DEFAULT 'in_progress'
    CHECK (work_status IN ('not_started', 'in_progress', 'completed'));

-- Students can read mentorship records for their own student row (portal view)
DROP POLICY IF EXISTS "student_view_own_mentorships" ON student_mentorships;
CREATE POLICY "student_view_own_mentorships"
  ON student_mentorships
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM students s WHERE s.id = student_id AND s.portal_user_id = auth.uid())
  );


-- ────────────────────────────────────────────────────────────
-- MIGRATION: 081_student_documents_bucket.sql
-- ────────────────────────────────────────────────────────────
-- Ensure the 'student-documents' storage bucket exists (used by admission docs,
-- portal manager and mentorship screenshots). Public read, authenticated upload.

insert into storage.buckets (id, name, public)
values ('student-documents', 'student-documents', true)
on conflict (id) do nothing;

-- Authenticated users can upload to the bucket
drop policy if exists "student_docs_auth_upload" on storage.objects;
CREATE POLICY "student_docs_auth_upload"
  ON storage.objects
  for insert to authenticated
  with check (bucket_id = 'student-documents');

-- Authenticated users can update/overwrite (upsert)
drop policy if exists "student_docs_auth_update" on storage.objects;
CREATE POLICY "student_docs_auth_update"
  ON storage.objects
  for update to authenticated
  using (bucket_id = 'student-documents');

-- Anyone can read (bucket is public)
drop policy if exists "student_docs_public_read" on storage.objects;
CREATE POLICY "student_docs_public_read"
  ON storage.objects
  for select
  using (bucket_id = 'student-documents');


-- ────────────────────────────────────────────────────────────
-- MIGRATION: 082_mentorship_stages_payments.sql
-- ────────────────────────────────────────────────────────────
-- Mentorship redesign: one CareerOptics "case" per student with a 3-stage journey,
-- and installment payments recorded against the whole case (admin-approved).

-- 1) Stage journey on the case row (student_mentorships acts as the case)
ALTER TABLE student_mentorships
  ADD COLUMN IF NOT EXISTS stages        JSONB NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS current_stage TEXT;

-- 2) Installment payments ledger (per case), each verified/approved by admin
CREATE TABLE IF NOT EXISTS mentorship_payments (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mentorship_id  UUID NOT NULL REFERENCES student_mentorships(id) ON DELETE CASCADE,
  amount         NUMERIC(10,2) NOT NULL,
  paid_on        DATE,
  screenshot_url TEXT,
  note           TEXT,
  status            TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'approved', 'rejected')),
  salary_percentage NUMERIC(5,2),
  admin_remarks     TEXT,
  approved_by       UUID REFERENCES profiles(id) ON DELETE SET NULL,
  approved_at       TIMESTAMPTZ,
  created_by        UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_mp_mentorship ON mentorship_payments(mentorship_id);
CREATE INDEX IF NOT EXISTS idx_mp_status     ON mentorship_payments(status);

ALTER TABLE mentorship_payments ENABLE ROW LEVEL SECURITY;

-- Admin / backend: full access
DROP POLICY IF EXISTS "mp_admin_all" ON mentorship_payments;
CREATE POLICY "mp_admin_all"
  ON mentorship_payments FOR ALL
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'backend')));

-- Mentor (telecaller/lead/counselor): manage payments for their own cases
DROP POLICY IF EXISTS "mp_mentor_insert" ON mentorship_payments;
CREATE POLICY "mp_mentor_insert"
  ON mentorship_payments FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM student_mentorships m WHERE m.id = mentorship_id AND m.telecaller_id = auth.uid()
  ));
DROP POLICY IF EXISTS "mp_mentor_select" ON mentorship_payments;
CREATE POLICY "mp_mentor_select"
  ON mentorship_payments FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM student_mentorships m WHERE m.id = mentorship_id AND m.telecaller_id = auth.uid()
  ));

-- Student: read payments for their own mentorship case
DROP POLICY IF EXISTS "mp_student_select" ON mentorship_payments;
CREATE POLICY "mp_student_select"
  ON mentorship_payments FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM student_mentorships m
    JOIN students s ON s.id = m.student_id
    WHERE m.id = mentorship_id AND s.portal_user_id = auth.uid()
  ));


-- ────────────────────────────────────────────────────────────
-- MIGRATION: 083_mentor_incentives.sql
-- ────────────────────────────────────────────────────────────
-- Exact incentive amount on a payment + a mentor incentive ledger
-- (credited to the mentor when a mentorship payment is approved)

ALTER TABLE mentorship_payments
  ADD COLUMN IF NOT EXISTS incentive_amount NUMERIC(10,2);

CREATE TABLE IF NOT EXISTS mentor_incentives (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mentor_id   UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  payment_id  UUID REFERENCES mentorship_payments(id) ON DELETE SET NULL,
  student_id  UUID REFERENCES students(id) ON DELETE SET NULL,
  amount      NUMERIC(10,2) NOT NULL,
  reason      TEXT,
  created_by  UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_mi_mentor ON mentor_incentives(mentor_id);

ALTER TABLE mentor_incentives ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "mi_admin_all" ON mentor_incentives;
CREATE POLICY "mi_admin_all"
  ON mentor_incentives FOR ALL
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'backend')));

DROP POLICY IF EXISTS "mi_mentor_read" ON mentor_incentives;
CREATE POLICY "mi_mentor_read"
  ON mentor_incentives FOR SELECT
  USING (mentor_id = auth.uid());


-- ────────────────────────────────────────────────────────────
-- MIGRATION: 084_fix_june_payroll_basic.sql
-- ────────────────────────────────────────────────────────────
-- One-time fix: the mentorship-incentive credit had created payroll rows with
-- basic/HRA/allowances = 0 (only the incentive amount), wiping the employee's
-- salary. Restore the salary structure from the employee on any such DRAFT stub
-- row (not yet paid), keep the already-credited incentive, and recompute
-- gross & net. Month-agnostic so it fixes whichever billing-cycle month the
-- credit landed in (e.g. June or July).

update payroll p
set basic      = e.basic_salary,
    hra        = e.hra,
    allowances = e.allowances,
    pf         = e.pf_deduction,
    tds        = e.tds_deduction,
    gross      = coalesce(e.basic_salary,0) + coalesce(e.hra,0) + coalesce(e.allowances,0) + coalesce(p.incentive,0),
    net        = coalesce(e.basic_salary,0) + coalesce(e.hra,0) + coalesce(e.allowances,0) + coalesce(p.incentive,0)
                 - coalesce(e.pf_deduction,0) - coalesce(e.tds_deduction,0)
                 - coalesce(p.other_deductions,0) - coalesce(p.leave_deduction,0)
from employees e
where p.employee_id = e.id
  and p.status = 'draft'                 -- never touch processed/paid rows
  and coalesce(p.basic, 0) = 0           -- only the broken stub rows
  and coalesce(e.basic_salary, 0) > 0;   -- only employees that have a salary set


-- ────────────────────────────────────────────────────────────
-- MIGRATION: 085_mentorship_payment_dedupe_guard.sql
-- ────────────────────────────────────────────────────────────
-- Prevent duplicate active mentorship installment rows for the same case.
-- Rejected rows are excluded so a counselor can resubmit a corrected payment.

CREATE UNIQUE INDEX IF NOT EXISTS idx_mp_unique_active_installment
ON mentorship_payments (
  mentorship_id,
  amount,
  paid_on,
  note,
  (COALESCE(screenshot_url, ''))
)
WHERE status <> 'rejected';


-- ────────────────────────────────────────────────────────────
-- MIGRATION: 086_dispatch_father_name.sql
-- ────────────────────────────────────────────────────────────
-- The dispatch form captures the student's father's name but the table was
-- missing the column, causing inserts to fail with
-- "Could not find the 'father_name' column of 'student_dispatches'".
alter table student_dispatches
  add column if not exists father_name text;


-- ────────────────────────────────────────────────────────────
-- MIGRATION: 087_dispatch_columns_full.sql
-- ────────────────────────────────────────────────────────────
-- Ensure student_dispatches has every column the Dispatch/Receive form writes.
-- Safe to run multiple times (IF NOT EXISTS on each column).

alter table student_dispatches add column if not exists dispatch_type     text;
alter table student_dispatches add column if not exists student_name      text;
alter table student_dispatches add column if not exists student_phone     text;
alter table student_dispatches add column if not exists father_name       text;
alter table student_dispatches add column if not exists enrollment_number text;
alter table student_dispatches add column if not exists associate_id      uuid;
alter table student_dispatches add column if not exists document_type     text;
alter table student_dispatches add column if not exists courier           text;
alter table student_dispatches add column if not exists tracking_number   text;
alter table student_dispatches add column if not exists dispatch_date     date;
alter table student_dispatches add column if not exists expected_delivery date;
alter table student_dispatches add column if not exists status            text;
alter table student_dispatches add column if not exists remarks           text;
alter table student_dispatches add column if not exists dispatched_by     uuid;
alter table student_dispatches add column if not exists created_at        timestamptz default now();
alter table student_dispatches add column if not exists updated_at        timestamptz default now();

-- Refresh PostgREST's schema cache so the new columns are picked up immediately.
notify pgrst, 'reload schema';


-- ────────────────────────────────────────────────────────────
-- MIGRATION: 088_revenue_targets.sql
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS revenue_targets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assignee_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL DEFAULT 'Revenue Target',
  target_amount NUMERIC(12,2) NOT NULL DEFAULT 0 CHECK (target_amount >= 0),
  lead_target INTEGER NOT NULL DEFAULT 0 CHECK (lead_target >= 0),
  conversion_target INTEGER NOT NULL DEFAULT 0 CHECK (conversion_target >= 0),
  period_type TEXT NOT NULL DEFAULT 'monthly' CHECK (period_type IN ('daily','weekly','monthly','quarterly','custom')),
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  bonus_percentage NUMERIC(5,2) NOT NULL DEFAULT 0 CHECK (bonus_percentage >= 0),
  notes TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','archived')),
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT revenue_targets_valid_dates CHECK (end_date >= start_date)
);

CREATE INDEX IF NOT EXISTS idx_revenue_targets_assignee ON revenue_targets(assignee_id);
CREATE INDEX IF NOT EXISTS idx_revenue_targets_dates ON revenue_targets(start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_revenue_targets_status ON revenue_targets(status);

CREATE OR REPLACE FUNCTION set_revenue_targets_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS revenue_targets_updated_at ON revenue_targets;
DROP TRIGGER IF EXISTS revenue_targets_updated_at ON revenue_targets;
CREATE TRIGGER revenue_targets_updated_at
  BEFORE UPDATE ON revenue_targets
  FOR EACH ROW EXECUTE FUNCTION set_revenue_targets_updated_at();

ALTER TABLE revenue_targets ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can manage revenue targets" ON revenue_targets;
CREATE POLICY "Admins can manage revenue targets"
  ON revenue_targets FOR ALL
  USING (
    EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
  );

DROP POLICY IF EXISTS "Counselors can view assigned revenue targets" ON revenue_targets;
CREATE POLICY "Counselors can view assigned revenue targets"
  ON revenue_targets FOR SELECT
  USING (assignee_id = auth.uid());

DROP POLICY IF EXISTS "Counselors can view own target payments" ON payments;
CREATE POLICY "Counselors can view own target payments"
  ON payments FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role IN ('admin','backend','finance'))
    OR EXISTS (SELECT 1 FROM leads l WHERE l.id = payments.lead_id AND l.assigned_to = auth.uid())
    OR EXISTS (SELECT 1 FROM students s WHERE s.id = payments.student_id AND s.assigned_counsellor = auth.uid())
  );


-- ────────────────────────────────────────────────────────────
-- MIGRATION: 089_mentorship_telecaller_update.sql
-- ────────────────────────────────────────────────────────────
-- Telecallers could INSERT and SELECT their own mentorship cases but had no
-- UPDATE policy, so editing an existing case silently updated 0 rows and the
-- data never recorded. Allow mentors to update their own cases.

DROP POLICY IF EXISTS "telecaller_update_own" ON student_mentorships;
CREATE POLICY "telecaller_update_own"
  ON student_mentorships
  FOR UPDATE
  USING (telecaller_id = auth.uid())
  WITH CHECK (telecaller_id = auth.uid());


-- ────────────────────────────────────────────────────────────
-- MIGRATION: 090_dispatch_receiver_fields.sql
-- ────────────────────────────────────────────────────────────
-- Who collected the document when it was handed over at the office
-- (instead of couriered): the student themself or a guardian/relative.

alter table student_dispatches add column if not exists received_by       text; -- 'self' | 'guardian'
alter table student_dispatches add column if not exists receiver_name     text;
alter table student_dispatches add column if not exists receiver_relation text;
alter table student_dispatches add column if not exists receiver_phone    text;

notify pgrst, 'reload schema';


-- ────────────────────────────────────────────────────────────
-- MIGRATION: 091_advance_salary.sql
-- ────────────────────────────────────────────────────────────
-- Advance salary ledger + payroll advance deduction column

create table if not exists advance_salaries (
  id          uuid primary key default gen_random_uuid(),
  employee_id uuid not null references employees(id) on delete cascade,
  amount      numeric(10,2) not null check (amount > 0),
  given_on    date not null default current_date,
  reason      text,
  status      text not null default 'pending' check (status in ('pending','settled','cancelled')),
  settled_in  uuid references payroll(id) on delete set null,
  created_by  uuid references profiles(id) on delete set null,
  created_at  timestamptz not null default now()
);

create index if not exists idx_adv_emp on advance_salaries(employee_id);

alter table advance_salaries enable row level security;

drop policy if exists "adv_admin_all" on advance_salaries;
CREATE POLICY "adv_admin_all"
  ON advance_salaries for all
  using (exists (select 1 from profiles where id = auth.uid() and role in ('admin','backend')));

drop policy if exists "adv_employee_read" on advance_salaries;
CREATE POLICY "adv_employee_read"
  ON advance_salaries for select
  using (exists (select 1 from employees where id = employee_id and profile_id = auth.uid()));

alter table payroll add column if not exists advance_deduction numeric(10,2) not null default 0;

notify pgrst, 'reload schema';


-- ────────────────────────────────────────────────────────────
-- MIGRATION: 092_notifications_target_user.sql
-- ────────────────────────────────────────────────────────────
-- Per-user targeted notifications (e.g. "new Meta lead assigned to you").
-- target_user_id null = broadcast / role-targeted (existing behaviour).
ALTER TABLE notifications
  ADD COLUMN IF NOT EXISTS target_user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_notifications_target_user ON notifications(target_user_id);


-- ────────────────────────────────────────────────────────────
-- MIGRATION: 093_realtime_publication.sql
-- ────────────────────────────────────────────────────────────
-- The supabase_realtime publication had no tables, so every existing
-- postgres_changes subscription (NotificationBell live reload/toasts) was
-- silently dead. Add the tables the app subscribes to.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND tablename = 'leads'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE leads;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND tablename = 'notifications'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE notifications;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND tablename = 'tasks'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE tasks;
  END IF;
END $$;


-- ────────────────────────────────────────────────────────────
-- MIGRATION: 094_managed_by_hd.sql
-- ────────────────────────────────────────────────────────────
-- Rebrand mentorship managed_by value: 'dcw' → 'hd'
ALTER TABLE student_mentorships DROP CONSTRAINT IF EXISTS student_mentorships_managed_by_check;
UPDATE student_mentorships SET managed_by = 'hd' WHERE managed_by = 'dcw';
ALTER TABLE student_mentorships ALTER COLUMN managed_by SET DEFAULT 'hd';
ALTER TABLE student_mentorships DROP CONSTRAINT IF EXISTS student_mentorships_managed_by_check;
ALTER TABLE student_mentorships ADD CONSTRAINT student_mentorships_managed_by_check CHECK (managed_by IN ('hd', 'self'));


-- ────────────────────────────────────────────────────────────
-- MIGRATION: 095_fix_profiles_recursion.sql
-- ────────────────────────────────────────────────────────────
-- Fix: "infinite recursion detected in policy for relation profiles" (42P17)
-- The admin policy on profiles queried profiles inside its own USING clause.
-- A SECURITY DEFINER helper bypasses RLS for the role lookup, breaking the loop.

CREATE OR REPLACE FUNCTION crm.get_my_role()
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = crm, public, extensions
AS $$
  SELECT role FROM crm.profiles WHERE id = auth.uid()
$$;

REVOKE ALL ON FUNCTION crm.get_my_role() FROM anon;
GRANT EXECUTE ON FUNCTION crm.get_my_role() TO authenticated;

DROP POLICY IF EXISTS "Admins can manage all profiles" ON profiles;
CREATE POLICY "Admins can manage all profiles"
  ON profiles FOR ALL
  USING (crm.get_my_role() = 'admin')
  WITH CHECK (crm.get_my_role() = 'admin');


-- ────────────────────────────────────────────────────────────
-- MIGRATION: 098_leads_extra_data.sql
-- ────────────────────────────────────────────────────────────
-- LeadForm stores custom form-field values and followup time in extra_data.
-- (Column existed only out-of-band in the original project's DB.)
ALTER TABLE leads ADD COLUMN IF NOT EXISTS extra_data jsonb;

-- ────────────────────────────────────────────────────────────
-- CareerOptics additions
-- ────────────────────────────────────────────────────────────

-- Buckets the CRM uploads to besides `student-documents`.
insert into storage.buckets (id, name, public) values
  ('associate-docs', 'associate-docs', true),
  ('associate-receipts', 'associate-receipts', true)
on conflict (id) do nothing;

drop policy if exists "crm_assoc_buckets_auth_upload" on storage.objects;
create policy "crm_assoc_buckets_auth_upload" on storage.objects
  for insert to authenticated
  with check (bucket_id in ('associate-docs', 'associate-receipts'));
drop policy if exists "crm_assoc_buckets_auth_update" on storage.objects;
create policy "crm_assoc_buckets_auth_update" on storage.objects
  for update to authenticated
  using (bucket_id in ('associate-docs', 'associate-receipts'));
drop policy if exists "crm_assoc_buckets_public_read" on storage.objects;
create policy "crm_assoc_buckets_public_read" on storage.objects
  for select
  using (bucket_id in ('associate-docs', 'associate-receipts'));

-- Master data: CRM courses mirror the website catalogue; departments follow
-- the site's four study levels. All editable from CRM → Settings.
insert into crm.courses (name, is_active)
select c.name, true from public.courses c
where not exists (select 1 from crm.courses x where x.name = c.name);

insert into crm.departments (name, is_active)
select v.name, true from (values
  ('After 10th'), ('After 12th'), ('After Graduation'), ('After PG')
) as v(name)
where not exists (select 1 from crm.departments d where d.name = v.name);

insert into crm.sessions (name, is_active)
select v.name, true from (values ('2025-26'), ('2026-27'), ('2027-28')) as v(name)
where not exists (select 1 from crm.sessions s where s.name = v.name);

-- Pin every CRM function to the crm schema, whatever search_path the caller
-- (PostgREST, a trigger fired from public, GoTrue) happens to have.
do $$
declare r record;
begin
  for r in
    select p.oid::regprocedure as sig
    from pg_proc p join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'crm' and p.prokind = 'f'
  loop
    execute format('alter function %s set search_path = crm, public, extensions', r.sig);
  end loop;
end $$;

-- API grants. RLS on every table stays the real boundary.
grant all on all tables in schema crm to anon, authenticated, service_role;
grant all on all sequences in schema crm to anon, authenticated, service_role;
grant execute on all functions in schema crm to anon, authenticated, service_role;
alter default privileges in schema crm grant all on tables to anon, authenticated, service_role;
alter default privileges in schema crm grant all on sequences to anon, authenticated, service_role;
alter default privileges in schema crm grant execute on functions to anon, authenticated, service_role;

reset search_path;
