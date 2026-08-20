-- Student mentorship: admin assigns telecallers to students for follow-up work

CREATE TABLE IF NOT EXISTS crm.student_mentorships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id    UUID NOT NULL REFERENCES crm.students(id) ON DELETE CASCADE,
  telecaller_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  task_type     TEXT NOT NULL CHECK (task_type IN ('work_assignment', 'practical', 'exam')),
  description   TEXT,
  rating        NUMERIC(3,1) CHECK (rating >= 0 AND rating <= 10),

  -- Admin approval fields
  status           TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'approved', 'rejected')),
  salary_percentage NUMERIC(5,2),
  admin_remarks    TEXT,
  approved_by      UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  approved_at      TIMESTAMPTZ,

  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_sm_student    ON crm.student_mentorships(student_id);
CREATE INDEX IF NOT EXISTS idx_sm_telecaller ON crm.student_mentorships(telecaller_id);
CREATE INDEX IF NOT EXISTS idx_sm_status     ON crm.student_mentorships(status);

ALTER TABLE crm.student_mentorships ENABLE ROW LEVEL SECURITY;

-- Admin/backend: full access
CREATE POLICY "admin_mentorships_all" ON crm.student_mentorships FOR ALL
  USING (crm.is_manager());

-- Telecallers: can read mentorships assigned to them
CREATE POLICY "telecaller_view_own" ON crm.student_mentorships FOR SELECT
  USING (telecaller_id = auth.uid());
