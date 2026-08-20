-- Notifications: admin broadcasts and targeted messages.
-- dcwcrm keeps these in public because non-CRM staff also need to read them.

create table if not exists crm.notifications (
  id          uuid primary key default gen_random_uuid(),
  title       text not null,
  message     text not null,
  type        text not null default 'info'
              check (type in ('info', 'warning', 'success', 'alert')),
  target_role text,
  target_user_id uuid references public.profiles(id) on delete cascade,
  created_by  uuid references public.profiles(id) on delete set null,
  created_at  timestamptz not null default now()
);

create table if not exists crm.notification_reads (
  id              uuid primary key default gen_random_uuid(),
  notification_id uuid not null references crm.notifications(id) on delete cascade,
  user_id         uuid not null references public.profiles(id) on delete cascade,
  read_at         timestamptz default now(),
  unique (notification_id, user_id)
);

create index if not exists idx_notifications_target_user on crm.notifications (target_user_id);
create index if not exists idx_notifications_target_role on crm.notifications (target_role);
create index if not exists idx_notifications_created on crm.notifications (created_at desc);

alter table crm.notifications enable row level security;
alter table crm.notification_reads enable row level security;

create policy "authenticated read notifications" on crm.notifications for select
  using (auth.uid() is not null);

create policy "admin insert notifications" on crm.notifications for insert
  with check (
    crm.is_manager()
  );

create policy "own notification reads" on crm.notification_reads for select
  using (auth.uid() = user_id);

create policy "own notification read insert" on crm.notification_reads for insert
  with check (auth.uid() = user_id);
