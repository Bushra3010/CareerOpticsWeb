-- Payroll table

create table if not exists crm.payroll (
  id uuid primary key default gen_random_uuid(),
  -- FK added in 0019, once crm.employees exists.
  employee_id uuid not null,
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
  advance_deduction numeric(10,2) not null default 0,
  net numeric(12,2) not null default 0,
  status text not null default 'draft' check (status in ('draft','processed','paid')),
  payment_date date,
  created_at timestamptz not null default now(),
  unique (employee_id, month, year)
);

create index if not exists payroll_emp_idx on crm.payroll(employee_id);
create index if not exists payroll_status_idx on crm.payroll(status);

alter table crm.payroll enable row level security;

create policy "admin_manage_payroll" on crm.payroll for all
  using (crm.is_manager())
  with check (crm.is_manager());

-- The self-service read policy is created in 0019 with crm.employees.
