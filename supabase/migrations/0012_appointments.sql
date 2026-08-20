-- Appointments: counselor/admin bookings against a lead (office visit or Google Meet).

create table if not exists crm.appointments (
  id               uuid primary key default gen_random_uuid(),
  lead_id           uuid not null references crm.leads(id) on delete cascade,
  appointment_type  text not null check (appointment_type in ('office_visit', 'google_meet')),
  meet_link         text,
  host_id           uuid not null references public.profiles(id) on delete set null,
  created_by        uuid not null references public.profiles(id) on delete set null,
  scheduled_date    date not null,
  scheduled_time    time not null,
  duration_minutes  int not null default 30 check (duration_minutes > 0),
  status            text not null default 'scheduled'
                     check (status in ('scheduled', 'completed', 'cancelled', 'no_show')),
  notes             text,
  review_note       text,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),
  constraint appointments_meet_link_required check (
    appointment_type <> 'google_meet' or (meet_link is not null and btrim(meet_link) <> '')
  )
);

create index if not exists crm_appointments_lead_idx      on crm.appointments (lead_id);
create index if not exists crm_appointments_date_idx       on crm.appointments (scheduled_date);
create index if not exists crm_appointments_host_idx       on crm.appointments (host_id);

-- Slot lock: no two active bookings for the same host at the same slot.
create unique index if not exists crm_appointments_slot_unique
  on crm.appointments (host_id, scheduled_date, scheduled_time)
  where status <> 'cancelled';

create or replace function crm.set_appointments_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end;
$$;

drop trigger if exists crm_appointments_updated_at on crm.appointments;
create trigger crm_appointments_updated_at
  before update on crm.appointments
  for each row execute function crm.set_appointments_updated_at();

alter table crm.appointments enable row level security;

create policy "staff read appointments" on crm.appointments for select to authenticated
  using (crm.is_crm_staff());

create policy "staff insert appointments" on crm.appointments for insert to authenticated
  with check (
    crm.is_crm_staff()
    and created_by = auth.uid()
    -- The host must be an active staff member. Any staff member can host;
    -- the enum has no separate "can be booked" role to narrow it to.
    and exists (select 1 from public.profiles where id = host_id and is_active)
  );

create policy "own appointments update" on crm.appointments for update to authenticated
  using (
    host_id = auth.uid() or created_by = auth.uid() or crm.is_manager()
  )
  with check (
    host_id = auth.uid() or created_by = auth.uid() or crm.is_manager()
  );

create policy "manager delete appointments" on crm.appointments for delete to authenticated
  using (crm.is_manager());
