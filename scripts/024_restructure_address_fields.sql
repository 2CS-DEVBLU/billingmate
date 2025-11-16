-- Add structured address fields to companies table
ALTER TABLE companies
ADD COLUMN IF NOT EXISTS street TEXT,
ADD COLUMN IF NOT EXISTS number TEXT,
ADD COLUMN IF NOT EXISTS zip_code TEXT,
ADD COLUMN IF NOT EXISTS neighborhood TEXT,
ADD COLUMN IF NOT EXISTS city TEXT,
ADD COLUMN IF NOT EXISTS state TEXT,
ADD COLUMN IF NOT EXISTS country TEXT;

-- Update country field from existing country_code if needed
UPDATE companies 
SET country = CASE country_code
  WHEN 'BR' THEN 'Brazil'
  WHEN 'US' THEN 'United States'
  WHEN 'GB' THEN 'United Kingdom'
  WHEN 'DE' THEN 'Germany'
  WHEN 'FR' THEN 'France'
  WHEN 'CA' THEN 'Canada'
  WHEN 'AU' THEN 'Australia'
  ELSE 'Other'
END
WHERE country IS NULL;

-- Keep the old address field for backwards compatibility but not required
-- address field can be deprecated later
