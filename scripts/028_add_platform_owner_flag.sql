-- Add flag to identify the platform owner company
ALTER TABLE companies
ADD COLUMN IF NOT EXISTS is_platform_owner BOOLEAN DEFAULT FALSE;

-- Mark 2CS as the platform owner company
UPDATE companies 
SET is_platform_owner = TRUE 
WHERE name = '2CS' OR name LIKE '%2CS%' OR name LIKE '%2cs%';

-- Add comment for clarity
COMMENT ON COLUMN companies.is_platform_owner IS 'Identifies the company that owns the platform (2CS). This company should be isolated from regular company management for security.';
