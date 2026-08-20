-- Associates portal: referral partners who bring in students/leads.

create table if not exists crm.associates (
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
  user_id uuid references public.profiles(id) on delete set null,
  wallet_balance numeric not null default 0,
  rejection_reason text,
  coordinator_id uuid references public.profiles(id) on delete set null,
  coordinator_name text,
  temp_password text,
  aadhar_doc_url text,
  pan_doc_url text,
  cheque_doc_url text,
  state text,
  district text,
  city text,
  institution_name text,
  institution_address text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  approved_at timestamptz,
  approved_by uuid references public.profiles(id) on delete set null
);

create table if not exists crm.associate_wallet_txns (
  id uuid primary key default gen_random_uuid(),
  associate_id uuid not null references crm.associates(id) on delete cascade,
  type text not null check (type in ('credit', 'debit')),
  amount numeric not null,
  reason text,
  created_at timestamptz not null default now()
);

create table if not exists crm.associate_notifications (
  id uuid primary key default gen_random_uuid(),
  associate_id uuid references crm.associates(id) on delete cascade,
  title text not null,
  message text,
  is_read boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists crm.associate_dispatches (
  id uuid primary key default gen_random_uuid(),
  associate_id uuid not null references crm.associates(id) on delete cascade,
  item_name text not null,
  quantity int not null default 1,
  tracking_number text,
  status text not null default 'processing' check (status in ('processing', 'shipped', 'delivered')),
  dispatched_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists crm.wallet_recharge_requests (
  id uuid primary key default gen_random_uuid(),
  associate_id uuid not null references crm.associates(id) on delete cascade,
  amount numeric not null,
  receipt_url text,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  rejection_reason text,
  approved_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  approved_at timestamptz
);

create table if not exists crm.associate_resources (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  type text not null default 'other'
    check (type in ('brochure','fee_structure','admission_form','marketing','poster','reel','training','other')),
  url text not null,
  file_size text,
  is_active boolean not null default true,
  uploaded_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists crm.associate_support_tickets (
  id uuid primary key default gen_random_uuid(),
  associate_id uuid not null references crm.associates(id) on delete cascade,
  subject text not null,
  message text not null,
  status text not null default 'open'
    check (status in ('open','in_progress','resolved','closed')),
  priority text not null default 'normal'
    check (priority in ('low','normal','high','urgent')),
  admin_reply text,
  replied_by uuid references public.profiles(id) on delete set null,
  replied_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists crm_associates_user_idx on crm.associates(user_id) where user_id is not null;
create index if not exists crm_associates_status_idx on crm.associates(status);
create index if not exists crm_assoc_wallet_assoc_idx on crm.associate_wallet_txns(associate_id);
create index if not exists crm_assoc_notif_assoc_idx on crm.associate_notifications(associate_id);
create index if not exists crm_assoc_dispatch_assoc_idx on crm.associate_dispatches(associate_id);
create index if not exists crm_assoc_resources_type_idx on crm.associate_resources(type, is_active);
create index if not exists crm_assoc_tickets_assoc_idx on crm.associate_support_tickets(associate_id);
create index if not exists crm_assoc_tickets_status_idx on crm.associate_support_tickets(status);
create index if not exists crm_recharge_assoc_idx on crm.wallet_recharge_requests(associate_id);

alter table crm.associates enable row level security;
alter table crm.associate_wallet_txns enable row level security;
alter table crm.associate_notifications enable row level security;
alter table crm.associate_dispatches enable row level security;
alter table crm.wallet_recharge_requests enable row level security;
alter table crm.associate_resources enable row level security;
alter table crm.associate_support_tickets enable row level security;

-- Associates read own, admin manages all
CREATE POLICY "admin_associates_all" ON crm.associates FOR ALL
  USING (crm.is_manager())
  WITH CHECK (crm.is_manager());
CREATE POLICY "associate_read_own" ON crm.associates FOR SELECT
  USING (user_id = auth.uid());
CREATE POLICY "associate_update_own" ON crm.associates FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "admin_wallet_all" ON crm.associate_wallet_txns FOR ALL
  USING (crm.is_manager())
  WITH CHECK (crm.is_manager());
CREATE POLICY "associate_read_wallet" ON crm.associate_wallet_txns FOR SELECT
  USING (associate_id IN (SELECT id FROM crm.associates WHERE user_id = auth.uid()));

CREATE POLICY "admin_notif_all" ON crm.associate_notifications FOR ALL
  USING (crm.is_manager())
  WITH CHECK (crm.is_manager());
CREATE POLICY "associate_read_notif" ON crm.associate_notifications FOR SELECT
  USING (associate_id IN (SELECT id FROM crm.associates WHERE user_id = auth.uid()));
CREATE POLICY "associate_mark_notif" ON crm.associate_notifications FOR UPDATE
  USING (associate_id IN (SELECT id FROM crm.associates WHERE user_id = auth.uid()));

CREATE POLICY "admin_dispatch_all" ON crm.associate_dispatches FOR ALL
  USING (crm.is_manager())
  WITH CHECK (crm.is_manager());
CREATE POLICY "associate_read_dispatch" ON crm.associate_dispatches FOR SELECT
  USING (associate_id IN (SELECT id FROM crm.associates WHERE user_id = auth.uid()));

CREATE POLICY "admin_recharge_all" ON crm.wallet_recharge_requests FOR ALL
  USING (crm.is_manager())
  WITH CHECK (crm.is_manager());
CREATE POLICY "associate_read_recharge" ON crm.wallet_recharge_requests FOR SELECT
  USING (associate_id IN (SELECT id FROM crm.associates WHERE user_id = auth.uid()));

CREATE POLICY "admin_resources_all" ON crm.associate_resources FOR ALL
  USING (crm.is_manager())
  WITH CHECK (crm.is_manager());
CREATE POLICY "associate_read_resources" ON crm.associate_resources FOR SELECT
  USING (is_active = true AND EXISTS (SELECT 1 FROM crm.associates WHERE user_id = auth.uid()));

CREATE POLICY "associate_tickets_all" ON crm.associate_support_tickets FOR ALL
  USING (associate_id IN (SELECT id FROM crm.associates WHERE user_id = auth.uid()))
  WITH CHECK (associate_id IN (SELECT id FROM crm.associates WHERE user_id = auth.uid()));
CREATE POLICY "admin_tickets_all" ON crm.associate_support_tickets FOR ALL
  USING (crm.is_manager())
  WITH CHECK (crm.is_manager());

-- Link leads/students to the associate who referred them
ALTER TABLE crm.leads
  ADD COLUMN IF NOT EXISTS referred_by_associate uuid REFERENCES crm.associates(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS crm_leads_referred_assoc_idx ON crm.leads(referred_by_associate);

ALTER TABLE crm.students
  ADD COLUMN IF NOT EXISTS referred_by_associate uuid REFERENCES crm.associates(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS crm_students_referred_assoc_idx ON crm.students(referred_by_associate) WHERE referred_by_associate IS NOT NULL;
