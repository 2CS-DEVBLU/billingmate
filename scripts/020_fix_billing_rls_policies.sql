-- Fix RLS policies for sync_logs table to allow inserts
DROP POLICY IF EXISTS "Users can view their company's sync logs" ON sync_logs;
DROP POLICY IF EXISTS "Admins can manage all sync logs" ON sync_logs;

-- Allow users to view their company's sync logs
CREATE POLICY "Users can view their company's sync logs"
  ON sync_logs FOR SELECT
  USING (
    company_id IN (
      SELECT company_id FROM profiles WHERE id = auth.uid()
    )
  );

-- Allow users to insert sync logs for their company
CREATE POLICY "Users can create sync logs for their company"
  ON sync_logs FOR INSERT
  WITH CHECK (
    company_id IN (
      SELECT company_id FROM profiles WHERE id = auth.uid()
    )
  );

-- Allow users to update sync logs for their company
CREATE POLICY "Users can update their company's sync logs"
  ON sync_logs FOR UPDATE
  USING (
    company_id IN (
      SELECT company_id FROM profiles WHERE id = auth.uid()
    )
  );

-- Admins can manage all sync logs
CREATE POLICY "Admins can manage all sync logs"
  ON sync_logs FOR ALL
  USING (is_admin());

-- Fix RLS policies for billing_history table
DROP POLICY IF EXISTS "Users can view their company billing history" ON billing_history;
DROP POLICY IF EXISTS "Admins can manage all billing history" ON billing_history;

-- Allow users to view their company's billing history
CREATE POLICY "Users can view their company billing history"
  ON billing_history FOR SELECT
  USING (
    company_id IN (
      SELECT company_id FROM profiles WHERE id = auth.uid()
    )
  );

-- Allow users to insert/update billing history for their company
CREATE POLICY "Users can manage their company billing history"
  ON billing_history FOR INSERT
  WITH CHECK (
    company_id IN (
      SELECT company_id FROM profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can update their company billing history"
  ON billing_history FOR UPDATE
  USING (
    company_id IN (
      SELECT company_id FROM profiles WHERE id = auth.uid()
    )
  );

-- Admins can manage all billing history
CREATE POLICY "Admins can manage all billing history"
  ON billing_history FOR ALL
  USING (is_admin());

-- Fix RLS policies for resource_costs table
DROP POLICY IF EXISTS "Users can view their company resource costs" ON resource_costs;
DROP POLICY IF EXISTS "Admins can manage all resource costs" ON resource_costs;

-- Allow users to view their company's resource costs
CREATE POLICY "Users can view their company resource costs"
  ON resource_costs FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM billing_history bh
      INNER JOIN profiles p ON p.company_id = bh.company_id
      WHERE bh.id = resource_costs.billing_history_id
      AND p.id = auth.uid()
    )
  );

-- Allow users to insert resource costs for their company's billing history
CREATE POLICY "Users can create resource costs for their company"
  ON resource_costs FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM billing_history bh
      INNER JOIN profiles p ON p.company_id = bh.company_id
      WHERE bh.id = resource_costs.billing_history_id
      AND p.id = auth.uid()
    )
  );

-- Allow users to delete resource costs for their company
CREATE POLICY "Users can delete their company resource costs"
  ON resource_costs FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM billing_history bh
      INNER JOIN profiles p ON p.company_id = bh.company_id
      WHERE bh.id = resource_costs.billing_history_id
      AND p.id = auth.uid()
    )
  );

-- Admins can manage all resource costs
CREATE POLICY "Admins can manage all resource costs"
  ON resource_costs FOR ALL
  USING (is_admin());
