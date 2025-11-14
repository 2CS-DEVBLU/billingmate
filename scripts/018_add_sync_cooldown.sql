-- Add last_manual_sync column to track cooldown
ALTER TABLE cloud_integrations
ADD COLUMN IF NOT EXISTS last_manual_sync TIMESTAMP WITH TIME ZONE;

-- Add comment explaining the cooldown
COMMENT ON COLUMN cloud_integrations.last_manual_sync IS 'Timestamp of last manual sync request (5-minute cooldown enforced)';
