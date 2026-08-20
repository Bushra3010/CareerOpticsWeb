-- Student documents (10th marksheet, passport, visa, etc.)
create table if not exists crm.student_documents (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references crm.students(id) on delete cascade,
  doc_type text not null check (doc_type in (
    '10th_marksheet','12th_marksheet','graduation','passport',
    'sop','lor','ielts_scorecard','pte_scorecard','offer_letter','visa','other'
  )),
  status text not null default 'pending' check (status in ('pending','received','verified','rejected')),
  file_url text,
  notes text,
  expiry_date date,
  uploaded_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (student_id, doc_type)
);

create index if not exists crm_student_documents_student_idx on crm.student_documents (student_id);

-- Student exams (IELTS, PTE, etc.)
create table if not exists crm.student_exams (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references crm.students(id) on delete cascade,
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

create index if not exists crm_student_exams_student_idx on crm.student_exams (student_id);

-- RLS. Both tables carry a student's identity documents and exam results, so
-- they follow crm.students: managers see everything, the assigned counsellor
-- or mentor sees their own, and the student sees their own via the portal.
alter table crm.student_documents enable row level security;
alter table crm.student_exams enable row level security;

create policy "manager reads documents" on crm.student_documents for select to authenticated
  using (crm.is_manager());
create policy "own student documents" on crm.student_documents for select to authenticated
  using (exists (
    select 1 from crm.students s
     where s.id = student_id
       and (s.assigned_counsellor = auth.uid() or s.mentor_telecaller_id = auth.uid())
  ));
create policy "staff write documents" on crm.student_documents for all to authenticated
  using (crm.is_manager()) with check (crm.is_crm_staff());

create policy "manager reads exams" on crm.student_exams for select to authenticated
  using (crm.is_manager());
create policy "own student exams" on crm.student_exams for select to authenticated
  using (exists (
    select 1 from crm.students s
     where s.id = student_id
       and (s.assigned_counsellor = auth.uid() or s.mentor_telecaller_id = auth.uid())
  ));
create policy "staff write exams" on crm.student_exams for all to authenticated
  using (crm.is_manager()) with check (crm.is_crm_staff());
