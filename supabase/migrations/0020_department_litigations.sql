-- Department litigation tracking system

-- Add dept_fund column to departments (manually updated balance)
ALTER TABLE crm.departments ADD COLUMN IF NOT EXISTS dept_fund NUMERIC(12,2) DEFAULT 0;

-- Create department_litigations table
CREATE TABLE IF NOT EXISTS crm.department_litigations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  department_id UUID NOT NULL REFERENCES crm.departments(id) ON DELETE CASCADE,
  sub_section_id UUID REFERENCES crm.department_sub_sections(id) ON DELETE SET NULL,
  session_id UUID REFERENCES crm.sessions(id) ON DELETE SET NULL,
  student_name TEXT NOT NULL,
  father_name TEXT,
  phone TEXT,
  litigation_amount NUMERIC(12,2) NOT NULL DEFAULT 0,
  amount_paid NUMERIC(12,2) NOT NULL DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Updated_at trigger
CREATE OR REPLACE FUNCTION crm.update_litigation_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS litigation_updated_at ON crm.department_litigations;
CREATE TRIGGER litigation_updated_at
  BEFORE UPDATE ON crm.department_litigations
  FOR EACH ROW EXECUTE FUNCTION crm.update_litigation_updated_at();

-- RLS
ALTER TABLE crm.department_litigations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "crm_staff_view_litigations" ON crm.department_litigations FOR SELECT
  USING (crm.is_manager());

CREATE POLICY "admin_manage_litigations" ON crm.department_litigations FOR ALL
  USING (crm.is_manager())
  WITH CHECK (crm.is_manager());
