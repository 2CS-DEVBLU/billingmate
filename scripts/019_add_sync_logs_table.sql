-- Create sync_logs table to track all sync operations
CREATE TABLE IF NOT EXISTS sync_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  integration_id UUID NOT NULL REFERENCES cloud_integrations(id) ON DELETE CASCADE,
  sync_type TEXT NOT NULL CHECK (sync_type IN ('manual', 'automated', 'scheduled')),
  status TEXT NOT NULL CHECK (status IN ('success', 'partial', 'failed', 'running')),
  started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE,
  duration_seconds INTEGER,
  records_synced INTEGER DEFAULT 0,
  errors_count INTEGER DEFAULT 0,
  error_message TEXT,
  sync_details JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_sync_logs_integration ON sync_logs(integration_id);
CREATE INDEX IF NOT EXISTS idx_sync_logs_company ON sync_logs(company_id);
CREATE INDEX IF NOT EXISTS idx_sync_logs_started_at ON sync_logs(started_at DESC);
CREATE INDEX IF NOT EXISTS idx_sync_logs_status ON sync_logs(status);

-- Enable RLS
ALTER TABLE sync_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their company's sync logs"
  ON sync_logs FOR SELECT
  USING (
    company_id IN (
      SELECT company_id FROM profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Admins can manage all sync logs"
  ON sync_logs FOR ALL
  USING (is_admin());

-- Add scheduled sync settings to cloud_integrations
ALTER TABLE cloud_integrations
ADD COLUMN IF NOT EXISTS auto_sync_enabled BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS auto_sync_time TIME DEFAULT '02:00:00',
ADD COLUMN IF NOT EXISTS last_auto_sync TIMESTAMP WITH TIME ZONE;

COMMENT ON COLUMN cloud_integrations.auto_sync_enabled IS 'Enable automated daily sync';
COMMENT ON COLUMN cloud_integrations.auto_sync_time IS 'Time of day to run automated sync (UTC)';
COMMENT ON COLUMN cloud_integrations.last_auto_sync IS 'Timestamp of last automated sync';
