-- HRMS: Employees, Attendance, Leave Requests, Expenses, Advance Salaries

-- =====================================================================
-- EMPLOYEES
-- =====================================================================
create table if not exists crm.employees (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade unique,
  employee_code text not null unique,
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

create index if not exists employees_profile_idx on crm.employees(profile_id);
create index if not exists employees_code_idx on crm.employees(employee_code);

alter table crm.employees enable row level security;

create policy "admin_manage_employees" on crm.employees for all
  using (crm.is_manager())
  with check (crm.is_manager());

create policy "employee_read_own" on crm.employees for select
  using (profile_id = auth.uid());

-- =====================================================================
-- ATTENDANCE
-- =====================================================================
create table if not exists crm.attendance (
  id uuid primary key default gen_random_uuid(),
  employee_id uuid not null references crm.employees(id) on delete cascade,
  date date not null,
  status text not null check (status in ('present','absent','half_day','late','leave','holiday')),
  clock_in time,
  clock_out time,
  notes text,
  marked_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  unique (employee_id, date)
);

create index if not exists attendance_emp_date_idx on crm.attendance(employee_id, date);

alter table crm.attendance enable row level security;

create policy "admin_manage_attendance" on crm.attendance for all
  using (crm.is_manager());

create policy "employee_read_own_attendance" on crm.attendance for select
  using (exists (select 1 from crm.employees where id = employee_id and profile_id = auth.uid()));

-- =====================================================================
-- LEAVE REQUESTS
-- =====================================================================
create table if not exists crm.leave_requests (
  id uuid primary key default gen_random_uuid(),
  employee_id uuid not null references crm.employees(id) on delete cascade,
  leave_type text not null check (leave_type in ('sick','casual','earned','unpaid','other')),
  from_date date not null,
  to_date date not null,
  reason text,
  status text not null default 'pending' check (status in ('pending','approved','rejected')),
  approved_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists leave_req_emp_idx on crm.leave_requests(employee_id);
create index if not exists leave_req_status_idx on crm.leave_requests(status);

alter table crm.leave_requests enable row level security;

create policy "admin_manage_leaves" on crm.leave_requests for all
  using (crm.is_manager());

create policy "employee_own_leaves" on crm.leave_requests for all
  using (exists (select 1 from crm.employees where id = employee_id and profile_id = auth.uid()))
  with check (exists (select 1 from crm.employees where id = employee_id and profile_id = auth.uid()));

-- =====================================================================
-- EXPENSES
-- =====================================================================
create table if not exists crm.expenses (
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
  submitted_by uuid references public.profiles(id) on delete set null,
  approved_by uuid references public.profiles(id) on delete set null,
  status text not null default 'pending' check (status in ('pending','approved','rejected')),
  created_at timestamptz not null default now()
);

create index if not exists expenses_status_idx on crm.expenses(status);
create index if not exists expenses_submitted_idx on crm.expenses(submitted_by);

alter table crm.expenses enable row level security;

create policy "finance_admin_view_expenses" on crm.expenses for select
  using (crm.is_manager());

create policy "staff_submit_expenses" on crm.expenses for insert
  with check (auth.uid() is not null);

create policy "finance_admin_update_expenses" on crm.expenses for update
  using (crm.is_manager());

-- =====================================================================
-- ADVANCE SALARIES
-- =====================================================================
create table if not exists crm.advance_salaries (
  id uuid primary key default gen_random_uuid(),
  employee_id uuid not null references crm.employees(id) on delete cascade,
  amount numeric(10,2) not null check (amount > 0),
  given_on date not null default current_date,
  reason text,
  status text not null default 'pending' check (status in ('pending','settled','cancelled')),
  settled_in uuid references crm.payroll(id) on delete set null,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists advance_sal_emp_idx on crm.advance_salaries(employee_id);

alter table crm.advance_salaries enable row level security;

create policy "admin_manage_advance" on crm.advance_salaries for all
  using (crm.is_manager())
  with check (crm.is_manager());

create policy "employee_read_own_advance" on crm.advance_salaries for select
  using (exists (select 1 from crm.employees where id = employee_id and profile_id = auth.uid()));

-- ── Deferred from 0018 ───────────────────────────────────────────────────────
-- crm.payroll is created first (advance_salaries.settled_in points at it), so
-- the two links back to crm.employees are closed here instead.
alter table crm.payroll
  add constraint payroll_employee_fk
  foreign key (employee_id) references crm.employees(id) on delete cascade;

create policy "employee_read_own_payroll" on crm.payroll for select
  using (exists (select 1 from crm.employees where id = employee_id and profile_id = auth.uid()));
