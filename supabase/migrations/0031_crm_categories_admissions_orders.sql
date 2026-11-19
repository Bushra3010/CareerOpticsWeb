-- CareerOptics — CRM business categories, B.Ed/D.El.Ed admission links,
-- multiple ID cards / marksheets per student, and physical document orders.
--
-- 1. Every lead and student belongs to one of four business lines:
--      credit_card       Bihar Student Credit Card
--      teacher_training  B.Ed / D.El.Ed
--      distance          Distance-education colleges
--      open_school       NIOS / BBOSE (10th & 12th)
-- 2. crm.admission_links — shareable B.Ed/D.El.Ed form links a counsellor
--    sends to a student. Submissions land as that counsellor's lead.
-- 3. crm.student_credentials — any number of ID cards / marksheets per
--    student, one per session/semester.
-- 4. crm.document_orders — a student orders a physical ID card / marksheet,
--    pays by UPI, staff verify the payment and dispatch it.

-- ─────────────────────────────────────────────────────────────
-- 1. Categories
-- ─────────────────────────────────────────────────────────────
alter table crm.leads add column if not exists category text;
alter table crm.leads drop constraint if exists leads_category_check;
alter table crm.leads add constraint leads_category_check
  check (category is null or category in ('credit_card', 'teacher_training', 'distance', 'open_school'));
create index if not exists idx_crm_leads_category on crm.leads(category);

alter table crm.students add column if not exists category text;
alter table crm.students drop constraint if exists students_category_check;
alter table crm.students add constraint students_category_check
  check (category is null or category in ('credit_card', 'teacher_training', 'distance', 'open_school'));
create index if not exists idx_crm_students_category on crm.students(category);

-- Website B.Ed / D.El.Ed applications are teacher training by definition.
update crm.leads set category = 'teacher_training'
where category is null and metadata->>'website_source' = 'teaching_admission';

-- A converted student inherits the lead's category.
update crm.students s set category = l.category
from crm.leads l
where s.lead_id = l.id and s.category is null and l.category is not null;

create or replace function crm.inherit_student_category()
returns trigger
language plpgsql
set search_path = crm, public, extensions
as $$
begin
  if NEW.category is null and NEW.lead_id is not null then
    select category into NEW.category from crm.leads where id = NEW.lead_id;
  end if;
  return NEW;
end;
$$;

drop trigger if exists trg_inherit_student_category on crm.students;
create trigger trg_inherit_student_category
  before insert on crm.students
  for each row execute function crm.inherit_student_category();

-- ─────────────────────────────────────────────────────────────
-- 2. Admission form links
-- ─────────────────────────────────────────────────────────────
create table if not exists crm.admission_links (
  id          uuid primary key default gen_random_uuid(),
  code        text not null unique default substr(replace(gen_random_uuid()::text, '-', ''), 1, 10),
  programme   text not null check (programme in ('B.Ed', 'D.El.Ed')),
  label       text,
  created_by  uuid references crm.profiles(id) on delete set null,
  is_active   boolean not null default true,
  submissions integer not null default 0,
  created_at  timestamptz not null default now()
);

alter table crm.admission_links enable row level security;

-- Staff only. The public form page reads a link through the service role.
drop policy if exists "staff manage admission links" on crm.admission_links;
create policy "staff manage admission links" on crm.admission_links
  for all to authenticated
  using (crm.is_crm_staff()) with check (crm.is_crm_staff());

-- Website → CRM bridge, now with category and link attribution.
create or replace function public.push_lead_to_crm()
returns trigger
language plpgsql
security definer
set search_path = crm, public, extensions
as $$
declare
  v_course   uuid;
  v_category text;
  v_assignee uuid;
  v_ref      text := NEW.answers->>'ref';
begin
  if NEW.course_id is not null then
    select cc.id into v_course
    from crm.courses cc
    join public.courses pc on pc.name = cc.name
    where pc.id = NEW.course_id
    limit 1;
  end if;

  if NEW.source = 'teaching_admission' then
    v_category := 'teacher_training';
  end if;

  -- Submitted through a counsellor's admission link: theirs to follow up.
  if v_ref is not null then
    update crm.admission_links
    set submissions = submissions + 1
    where code = v_ref and is_active
    returning created_by into v_assignee;
  end if;

  insert into crm.leads (full_name, phone, email, city, course_id, source, status,
                         category, assigned_to, assigned_at, metadata)
  values (
    coalesce(nullif(trim(NEW.name), ''), 'Website Enquiry'),
    right(regexp_replace(coalesce(NEW.phone, ''), '[^0-9]', '', 'g'), 10),
    nullif(trim(NEW.email), ''),
    nullif(trim(NEW.city), ''),
    v_course,
    'website',
    'new',
    v_category,
    v_assignee,
    case when v_assignee is not null then now() end,
    jsonb_strip_nulls(jsonb_build_object(
      'website_lead_id', NEW.id,
      'website_source',  NEW.source,
      'page_url',        NEW.page_url,
      'level',           NEW.level,
      'message',         NEW.message,
      'utm_source',      NEW.utm_source,
      'utm_medium',      NEW.utm_medium,
      'utm_campaign',    NEW.utm_campaign,
      'answers',         NEW.answers
    ))
  );

  if v_assignee is not null then
    insert into crm.notifications (title, message, type, target_user_id)
    values (
      'New admission form',
      coalesce(NEW.answers->>'programme', 'Admission') || ' form submitted by ' ||
        coalesce(nullif(trim(NEW.name), ''), 'a student') || ' through your link',
      'success',
      v_assignee
    );
  end if;
  return NEW;
exception when others then
  raise warning 'push_lead_to_crm failed: %', sqlerrm;
  return NEW;
end;
$$;

-- ─────────────────────────────────────────────────────────────
-- 3. ID cards / marksheets — many per student
-- ─────────────────────────────────────────────────────────────
create table if not exists crm.student_credentials (
  id            uuid primary key default gen_random_uuid(),
  student_id    uuid not null references crm.students(id) on delete cascade,
  kind          text not null check (kind in ('id_card', 'marksheet', 'admit_card', 'certificate', 'other')),
  session_label text,
  title         text,
  file_url      text not null,
  created_by    uuid references crm.profiles(id) on delete set null,
  created_at    timestamptz not null default now()
);
create index if not exists idx_student_credentials_student
  on crm.student_credentials(student_id, kind, created_at);

alter table crm.student_credentials enable row level security;

drop policy if exists "staff manage student credentials" on crm.student_credentials;
create policy "staff manage student credentials" on crm.student_credentials
  for all to authenticated
  using (crm.is_crm_staff()) with check (crm.is_crm_staff());

drop policy if exists "student reads own credentials" on crm.student_credentials;
create policy "student reads own credentials" on crm.student_credentials
  for select to authenticated
  using (student_id in (select id from crm.students where portal_user_id = auth.uid()));

-- ─────────────────────────────────────────────────────────────
-- 4. Physical document orders
-- ─────────────────────────────────────────────────────────────
create table if not exists crm.document_order_items (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  kind        text not null default 'other'
              check (kind in ('id_card', 'marksheet', 'admit_card', 'certificate', 'other')),
  description text,
  price       numeric(10,2) not null default 0 check (price >= 0),
  is_active   boolean not null default false,
  sort_order  integer not null default 0,
  created_at  timestamptz not null default now()
);

alter table crm.document_order_items enable row level security;

drop policy if exists "signed in reads active order items" on crm.document_order_items;
create policy "signed in reads active order items" on crm.document_order_items
  for select to authenticated using (is_active or crm.is_crm_staff());

drop policy if exists "staff manage order items" on crm.document_order_items;
create policy "staff manage order items" on crm.document_order_items
  for all to authenticated
  using (crm.is_crm_staff()) with check (crm.is_crm_staff());

-- Off until the office sets a real price.
insert into crm.document_order_items (name, kind, description, price, is_active, sort_order)
select * from (values
  ('Physical ID Card',    'id_card',     'Printed ID card, delivered by courier', 0::numeric, false, 1),
  ('Physical Marksheet',  'marksheet',   'Printed marksheet, delivered by courier', 0::numeric, false, 2),
  ('Physical Certificate','certificate', 'Printed certificate, delivered by courier', 0::numeric, false, 3)
) as v(name, kind, description, price, is_active, sort_order)
where not exists (select 1 from crm.document_order_items);

-- One row: where students pay.
create table if not exists crm.payment_settings (
  id           integer primary key default 1 check (id = 1),
  upi_id       text,
  payee_name   text,
  qr_image_url text,
  instructions text,
  updated_at   timestamptz not null default now()
);
insert into crm.payment_settings (id) values (1) on conflict (id) do nothing;

alter table crm.payment_settings enable row level security;

drop policy if exists "signed in reads payment settings" on crm.payment_settings;
create policy "signed in reads payment settings" on crm.payment_settings
  for select to authenticated using (true);

drop policy if exists "staff manage payment settings" on crm.payment_settings;
create policy "staff manage payment settings" on crm.payment_settings
  for all to authenticated
  using (crm.is_crm_staff()) with check (crm.is_crm_staff());

create table if not exists crm.document_orders (
  id                     uuid primary key default gen_random_uuid(),
  order_no               text not null unique
                         default 'ORD-' || to_char(now(), 'YYMMDD') || '-' || floor(random() * 9000 + 1000)::text,
  student_id             uuid not null references crm.students(id) on delete cascade,
  item_id                uuid references crm.document_order_items(id) on delete set null,
  item_name              text not null default '',
  kind                   text,
  session_label          text,
  quantity               integer not null default 1 check (quantity between 1 and 10),
  unit_price             numeric(10,2) not null default 0,
  amount                 numeric(10,2) not null default 0,
  delivery_name          text not null,
  delivery_phone         text not null,
  delivery_address       text not null,
  pincode                text,
  payment_utr            text not null,
  payment_screenshot_url text,
  status                 text not null default 'payment_submitted'
                         check (status in ('payment_submitted', 'payment_verified', 'dispatched',
                                           'delivered', 'rejected', 'cancelled')),
  courier                text,
  tracking_number        text,
  staff_note             text,
  verified_by            uuid references crm.profiles(id) on delete set null,
  verified_at            timestamptz,
  dispatched_at          timestamptz,
  created_at             timestamptz not null default now(),
  updated_at             timestamptz not null default now()
);
create index if not exists idx_document_orders_student on crm.document_orders(student_id, created_at desc);
create index if not exists idx_document_orders_status  on crm.document_orders(status, created_at desc);

alter table crm.document_orders enable row level security;

drop policy if exists "staff manage document orders" on crm.document_orders;
create policy "staff manage document orders" on crm.document_orders
  for all to authenticated
  using (crm.is_crm_staff()) with check (crm.is_crm_staff());

drop policy if exists "student reads own orders" on crm.document_orders;
create policy "student reads own orders" on crm.document_orders
  for select to authenticated
  using (student_id in (select id from crm.students where portal_user_id = auth.uid()));

drop policy if exists "student places own order" on crm.document_orders;
create policy "student places own order" on crm.document_orders
  for insert to authenticated
  with check (
    status = 'payment_submitted'
    and student_id in (select id from crm.students where portal_user_id = auth.uid())
  );

-- The price always comes from the item list, never from the browser.
create or replace function crm.price_document_order()
returns trigger
language plpgsql
security definer
set search_path = crm, public, extensions
as $$
declare
  v_item crm.document_order_items;
begin
  select * into v_item from crm.document_order_items where id = NEW.item_id;
  if v_item.id is null or not v_item.is_active then
    raise exception 'This item cannot be ordered right now';
  end if;
  NEW.item_name  := v_item.name;
  NEW.kind       := v_item.kind;
  NEW.unit_price := v_item.price;
  NEW.amount     := v_item.price * NEW.quantity;
  NEW.status     := 'payment_submitted';
  return NEW;
end;
$$;

drop trigger if exists trg_price_document_order on crm.document_orders;
create trigger trg_price_document_order
  before insert on crm.document_orders
  for each row execute function crm.price_document_order();

-- Office is told about every new order; the student about every status change.
create or replace function crm.notify_document_order()
returns trigger
language plpgsql
security definer
set search_path = crm, public, extensions
as $$
declare
  v_student crm.students;
  v_msg     text;
begin
  select * into v_student from crm.students where id = NEW.student_id;

  if TG_OP = 'INSERT' then
    insert into crm.notifications (title, message, type, target_role)
    select 'New document order',
           v_student.full_name || ' (' || coalesce(v_student.enrollment_number, '-') || ') ordered ' ||
             NEW.quantity || ' × ' || NEW.item_name || ' and paid ₹' || NEW.amount ||
             ' (UTR ' || NEW.payment_utr || '). Order ' || NEW.order_no,
           'alert',
           r
    from unnest(array['admin', 'backend']) as r;
    return NEW;
  end if;

  if NEW.status is distinct from OLD.status then
    NEW.updated_at := now();
    v_msg := case NEW.status
      when 'payment_verified' then 'Payment of ₹' || NEW.amount || ' verified. We are preparing your ' || NEW.item_name || '.'
      when 'dispatched' then 'Your ' || NEW.item_name || ' has been dispatched' ||
        coalesce(' via ' || NEW.courier, '') || coalesce('. Tracking no: ' || NEW.tracking_number, '') || '.'
      when 'delivered' then 'Your ' || NEW.item_name || ' has been delivered.'
      when 'rejected' then 'Your order could not be accepted' || coalesce(': ' || NEW.staff_note, '') ||
        '. Please contact the office.'
      when 'cancelled' then 'Your order was cancelled' || coalesce(': ' || NEW.staff_note, '') || '.'
      else null end;
    if v_msg is not null then
      insert into crm.student_notifications (student_id, title, message, type, category)
      values (NEW.student_id, 'Order ' || NEW.order_no,  v_msg,
              case when NEW.status in ('rejected', 'cancelled') then 'warning' else 'success' end,
              'order');
    end if;
  end if;
  return NEW;
end;
$$;

drop trigger if exists trg_notify_document_order_insert on crm.document_orders;
create trigger trg_notify_document_order_insert
  after insert on crm.document_orders
  for each row execute function crm.notify_document_order();

drop trigger if exists trg_notify_document_order_update on crm.document_orders;
create trigger trg_notify_document_order_update
  before update on crm.document_orders
  for each row execute function crm.notify_document_order();

grant select, insert, update, delete on
  crm.admission_links, crm.student_credentials, crm.document_order_items,
  crm.payment_settings, crm.document_orders
to authenticated;
grant all on
  crm.admission_links, crm.student_credentials, crm.document_order_items,
  crm.payment_settings, crm.document_orders
to service_role;
