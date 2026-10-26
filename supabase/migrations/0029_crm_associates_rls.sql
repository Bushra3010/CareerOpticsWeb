-- CareerOptics — row level security for the associate tables.
--
-- The ported CRM created these five tables with RLS off. With the `crm`
-- schema exposed through the API, that would let anyone holding the public
-- anon key read every associate's Aadhaar, PAN and bank account. CRM staff
-- keep full access; an associate sees only their own rows, can mark their own
-- notifications read and can raise their own wallet recharge requests.
-- Approvals and wallet movements go through /api/crm/associates/* with the
-- service role, which bypasses RLS.

create or replace function crm.is_crm_staff()
returns boolean
language sql
stable
security definer
set search_path = crm, public, extensions
as $$
  select exists (
    select 1 from crm.profiles
    where id = auth.uid() and is_active and role not in ('associate', 'student')
  )
$$;

create or replace function crm.my_associate_id()
returns uuid
language sql
stable
security definer
set search_path = crm, public, extensions
as $$
  select id from crm.associates where user_id = auth.uid() limit 1
$$;

revoke all on function crm.is_crm_staff() from anon;
revoke all on function crm.my_associate_id() from anon;
grant execute on function crm.is_crm_staff() to authenticated;
grant execute on function crm.my_associate_id() to authenticated;

alter table crm.associates                enable row level security;
alter table crm.associate_wallet_txns     enable row level security;
alter table crm.associate_notifications   enable row level security;
alter table crm.associate_dispatches      enable row level security;
alter table crm.wallet_recharge_requests  enable row level security;

do $$
declare t text;
begin
  foreach t in array array[
    'associates', 'associate_wallet_txns', 'associate_notifications',
    'associate_dispatches', 'wallet_recharge_requests'
  ] loop
    execute format('drop policy if exists "crm staff manage" on crm.%I', t);
    execute format(
      'create policy "crm staff manage" on crm.%I for all to authenticated
         using (crm.is_crm_staff()) with check (crm.is_crm_staff())', t);
  end loop;
end $$;

drop policy if exists "associate reads own row" on crm.associates;
create policy "associate reads own row" on crm.associates
  for select to authenticated using (user_id = auth.uid());

drop policy if exists "associate reads own txns" on crm.associate_wallet_txns;
create policy "associate reads own txns" on crm.associate_wallet_txns
  for select to authenticated using (associate_id = crm.my_associate_id());

drop policy if exists "associate reads own notifications" on crm.associate_notifications;
create policy "associate reads own notifications" on crm.associate_notifications
  for select to authenticated using (associate_id = crm.my_associate_id());

drop policy if exists "associate marks own notifications read" on crm.associate_notifications;
create policy "associate marks own notifications read" on crm.associate_notifications
  for update to authenticated
  using (associate_id = crm.my_associate_id())
  with check (associate_id = crm.my_associate_id());

drop policy if exists "associate reads own dispatches" on crm.associate_dispatches;
create policy "associate reads own dispatches" on crm.associate_dispatches
  for select to authenticated using (associate_id = crm.my_associate_id());

drop policy if exists "associate reads own recharge requests" on crm.wallet_recharge_requests;
create policy "associate reads own recharge requests" on crm.wallet_recharge_requests
  for select to authenticated using (associate_id = crm.my_associate_id());

drop policy if exists "associate raises own recharge request" on crm.wallet_recharge_requests;
create policy "associate raises own recharge request" on crm.wallet_recharge_requests
  for insert to authenticated
  with check (associate_id = crm.my_associate_id() and status = 'pending');

-- ─────────────────────────────────────────────────────────────
-- Staff-only tables that the port left open to any signed-in account
-- ─────────────────────────────────────────────────────────────
-- Students and associates now sign in to the same project, so "any
-- authenticated user" is no longer "any staff member". Call notes, litigation
-- and form configuration are staff data.
drop policy if exists "Users with lead access can view activities" on crm.lead_activities;
create policy "Users with lead access can view activities" on crm.lead_activities
  for select to authenticated using (crm.is_crm_staff());

drop policy if exists "Users can insert activities" on crm.lead_activities;
create policy "Users can insert activities" on crm.lead_activities
  for insert to authenticated with check (crm.is_crm_staff());

drop policy if exists "All staff can submit expenses" on crm.expenses;
create policy "All staff can submit expenses" on crm.expenses
  for insert to authenticated with check (crm.is_crm_staff());

drop policy if exists "Authenticated users can view litigations" on crm.department_litigations;
create policy "Authenticated users can view litigations" on crm.department_litigations
  for select to authenticated using (crm.is_crm_staff());

drop policy if exists "Authenticated users can view litigation payments" on crm.litigation_payments;
create policy "Authenticated users can view litigation payments" on crm.litigation_payments
  for select to authenticated using (crm.is_crm_staff());

drop policy if exists "Authenticated can manage form fields" on crm.lead_form_fields;
create policy "Authenticated can manage form fields" on crm.lead_form_fields
  for all to authenticated using (crm.is_crm_staff()) with check (crm.is_crm_staff());
