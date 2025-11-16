-- Add flag to identify the platform owner company
ALTER TABLE companies
ADD COLUMN IF NOT EXISTS is_platform_owner BOOLEAN DEFAULT FALSE NOT NULL;

-- Mark 2CS as the platform owner company (check multiple variations)
UPDATE companies 
SET is_platform_owner = TRUE 
WHERE LOWER(name) LIKE '%2cs%';

-- Add a check constraint to ensure only one platform owner exists
CREATE UNIQUE INDEX IF NOT EXISTS idx_single_platform_owner 
ON companies (is_platform_owner) 
WHERE is_platform_owner = TRUE;

-- Add comment for clarity
COMMENT ON COLUMN companies.is_platform_owner IS 'Identifies the company that owns the platform (2CS). This company should be isolated from regular company management for security. Only one company can be the platform owner.';
