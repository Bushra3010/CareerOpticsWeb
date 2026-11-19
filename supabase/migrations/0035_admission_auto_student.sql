-- 0035 — An admission becomes a pending student on its own.
--
-- Admissions are leads carrying `metadata.answers` from an admission form:
-- the CRM "New Admission" form (`metadata.entry = 'crm_admission_form'`) or a
-- counsellor's link (`answers.ref`). As soon as one is saved, a student row is
-- created with status 'pending', so it waits in Students → New Students for an
-- admin to approve — no manual Convert step.
--
-- The admission fee lands in the student's "paid" once it is confirmed:
--   * cash taken in the CRM form is confirmed at once (payment_verified = yes);
--   * a UPI payment (UTR + screenshot) is confirmed when staff press
--     "Mark verified" on the lead, which sets payment_verified = yes.
-- Either way a crm.payments row is written; the existing on_payment_inserted
-- trigger then recomputes amount_paid on the lead and the student.

create or replace function crm.admission_lead_sync()
returns trigger
language plpgsql
security definer
set search_path = crm, public
as $$
declare
  v_answers   jsonb := coalesce(NEW.metadata->'answers', '{}'::jsonb);
  v_was       boolean := false;
  v_now       boolean;
  v_amount    numeric;
  v_mode      text;
  v_student   uuid;
begin
  if not (NEW.metadata->>'entry' = 'crm_admission_form' or v_answers ? 'ref') then
    return NEW;
  end if;

  v_now := v_answers->>'payment_verified' = 'yes';
  if TG_OP = 'UPDATE' then
    v_was := coalesce(OLD.metadata->'answers'->>'payment_verified', '') = 'yes';
  end if;

  -- 1. Pending student (once per lead; a later manual Convert just updates it).
  insert into crm.students (lead_id, full_name, phone, email, city, course_id, sub_course_id,
                            assigned_counsellor, category, enrollment_date, status)
  values (NEW.id, NEW.full_name, NEW.phone, NEW.email, NEW.city, NEW.course_id, NEW.sub_course_id,
          NEW.assigned_to, NEW.category, current_date, 'pending')
  on conflict (lead_id) do nothing;

  -- 2. Fee, the moment it is confirmed.
  if v_now and not v_was then
    v_amount := nullif(regexp_replace(coalesce(v_answers->>'payment_amount', ''), '[^0-9.]', '', 'g'), '')::numeric;
    if v_amount > 0 then
      v_mode := case v_answers->>'payment_mode' when 'cash' then 'cash' when 'later' then 'other' else 'upi' end;
      select id into v_student from crm.students where lead_id = NEW.id;
      insert into crm.payments (lead_id, student_id, amount, payment_mode, payment_date, receipt_number, notes, recorded_by)
      values (
        NEW.id, v_student, v_amount, v_mode, current_date,
        nullif(left(v_answers->>'payment_utr', 60), ''),
        'Admission form fee',
        coalesce(auth.uid(), NEW.created_by)
      );
    end if;
  end if;

  return NEW;
end;
$$;

drop trigger if exists trg_admission_lead_sync on crm.leads;
create trigger trg_admission_lead_sync
  after insert or update of metadata on crm.leads
  for each row execute function crm.admission_lead_sync();
