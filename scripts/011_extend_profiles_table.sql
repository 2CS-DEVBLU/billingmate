-- Add additional fields to profiles table for comprehensive user management

-- Add new columns to profiles table
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS company_role TEXT,
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS is_reader BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS company_account_role TEXT DEFAULT 'viewer' CHECK (company_account_role IN ('admin', 'viewer')),
ADD COLUMN IF NOT EXISTS avatar_url TEXT;

-- Add comment for documentation
COMMENT ON COLUMN profiles.company_role IS 'User''s role within their company (e.g., CFO, Engineer, Manager)';
COMMENT ON COLUMN profiles.is_active IS 'Whether the user account is active or inactive';
COMMENT ON COLUMN profiles.is_reader IS 'Whether the user has read-only access';
COMMENT ON COLUMN profiles.company_account_role IS 'User''s permission level: admin can manage company, viewer can only view';
COMMENT ON COLUMN profiles.avatar_url IS 'URL to user''s avatar image';
