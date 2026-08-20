-- The only column 0008 does not already declare on crm.students.
-- Everything else the CRM port needed (father_name, guardian_*, mode,
-- department_id, sub_section_id, session_id, incentive_amount) is in 0008;
-- `referred_by_associate` arrives with the associates table in 0016.
alter table crm.students
  add column if not exists metadata jsonb not null default '{}'::jsonb;

create index if not exists crm_students_metadata_idx
  on crm.students using gin (metadata);
