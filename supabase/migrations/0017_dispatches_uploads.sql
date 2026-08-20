-- Student document dispatch tracking
CREATE TABLE IF NOT EXISTS crm.student_dispatches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_name text NOT NULL,
  enrollment_number text,
  associate_id uuid REFERENCES crm.associates(id) ON DELETE SET NULL,
  document_type text NOT NULL DEFAULT 'marksheet',
  dispatch_type text NOT NULL DEFAULT 'outbound'
    CHECK (dispatch_type IN ('inbound', 'outbound')),
  courier text,
  tracking_number text,
  dispatch_date date,
  expected_delivery date,
  status text NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending','dispatched','in_transit','delivered','returned','failed')),
  remarks text,
  student_phone text,
  father_name text,
  dispatched_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS crm_dispatches_assoc_idx ON crm.student_dispatches(associate_id);
CREATE INDEX IF NOT EXISTS crm_dispatches_status_idx ON crm.student_dispatches(status);
CREATE INDEX IF NOT EXISTS crm_dispatches_created_idx ON crm.student_dispatches(created_at DESC);
CREATE INDEX IF NOT EXISTS crm_dispatches_type_idx ON crm.student_dispatches(dispatch_type);

ALTER TABLE crm.student_dispatches ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admin_full_dispatch" ON crm.student_dispatches FOR ALL
  USING (crm.is_manager())
  WITH CHECK (crm.is_manager());

-- Student-uploaded documents
CREATE TABLE IF NOT EXISTS crm.student_uploads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL REFERENCES crm.students(id) ON DELETE CASCADE,
  document_type text NOT NULL,
  file_url text NOT NULL,
  remarks text,
  uploaded_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS crm_student_uploads_student_idx ON crm.student_uploads(student_id, uploaded_at DESC);

ALTER TABLE crm.student_uploads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admin_student_uploads" ON crm.student_uploads FOR ALL
  USING (crm.is_manager())
  WITH CHECK (crm.is_manager());

CREATE POLICY "student_own_uploads_select" ON crm.student_uploads FOR SELECT
  USING (student_id IN (SELECT id FROM crm.students WHERE portal_user_id = auth.uid()));

CREATE POLICY "student_own_uploads_insert" ON crm.student_uploads FOR INSERT
  WITH CHECK (student_id IN (SELECT id FROM crm.students WHERE portal_user_id = auth.uid()));
