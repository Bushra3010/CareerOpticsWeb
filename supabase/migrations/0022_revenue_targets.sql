-- Revenue targets: assign monetary/lead targets to counsellors with bonus config

CREATE TABLE IF NOT EXISTS crm.revenue_targets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assignee_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL DEFAULT 'Revenue Target',
  target_amount NUMERIC(12,2) NOT NULL DEFAULT 0 CHECK (target_amount >= 0),
  lead_target INTEGER NOT NULL DEFAULT 0 CHECK (lead_target >= 0),
  conversion_target INTEGER NOT NULL DEFAULT 0 CHECK (conversion_target >= 0),
  period_type TEXT NOT NULL DEFAULT 'monthly' CHECK (period_type IN ('daily','weekly','monthly','quarterly','custom')),
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  bonus_percentage NUMERIC(5,2) NOT NULL DEFAULT 0 CHECK (bonus_percentage >= 0),
  notes TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','archived')),
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT revenue_targets_valid_dates CHECK (end_date >= start_date)
);

CREATE INDEX IF NOT EXISTS idx_rev_targets_assignee ON crm.revenue_targets(assignee_id);
CREATE INDEX IF NOT EXISTS idx_rev_targets_dates ON crm.revenue_targets(start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_rev_targets_status ON crm.revenue_targets(status);

CREATE OR REPLACE FUNCTION crm.set_revenue_targets_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS revenue_targets_updated_at ON crm.revenue_targets;
CREATE TRIGGER revenue_targets_updated_at
  BEFORE UPDATE ON crm.revenue_targets
  FOR EACH ROW EXECUTE FUNCTION crm.set_revenue_targets_updated_at();

ALTER TABLE crm.revenue_targets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admin_manage_revenue_targets"
  ON crm.revenue_targets FOR ALL
  USING (crm.is_manager())
  WITH CHECK (crm.is_manager());

CREATE POLICY "counsellor_view_own_targets"
  ON crm.revenue_targets FOR SELECT
  USING (assignee_id = auth.uid());
