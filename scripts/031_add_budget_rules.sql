-- Budget Rules table for Phase 3: Budget Alerts
CREATE TABLE IF NOT EXISTS public.budget_rules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  name text NOT NULL,
  integration_id uuid REFERENCES public.cloud_integrations(id) ON DELETE CASCADE,
  threshold_amount numeric(10, 2) NOT NULL,
  threshold_type text NOT NULL CHECK (threshold_type IN ('absolute', 'percentage')),
  baseline_amount numeric(10, 2),
  alert_channels text[] DEFAULT ARRAY['in_app'],
  is_active boolean DEFAULT true,
  last_triggered_at timestamptz,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_budget_rules_company ON public.budget_rules(company_id);
CREATE INDEX IF NOT EXISTS idx_budget_rules_active ON public.budget_rules(is_active);

ALTER TABLE public.budget_rules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their company budget rules"
  ON public.budget_rules FOR SELECT
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND company_id = budget_rules.company_id));

CREATE POLICY "Admins can manage budget rules"
  ON public.budget_rules FOR ALL
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND company_id = budget_rules.company_id AND (company_account_role = 'admin' OR is_admin = true)));

CREATE POLICY "Platform admins can manage all budget rules"
  ON public.budget_rules FOR ALL
  USING (is_admin());
