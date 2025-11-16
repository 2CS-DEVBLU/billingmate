-- Add admin_user_id to companies table to track the administrator
ALTER TABLE companies 
ADD COLUMN IF NOT EXISTS admin_user_id uuid REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS is_active boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS deactivated_at timestamp with time zone,
ADD COLUMN IF NOT EXISTS reactivation_allowed_at timestamp with time zone,
ADD COLUMN IF NOT EXISTS vat_number text,
ADD COLUMN IF NOT EXISTS country_code text DEFAULT 'BR';

-- Add is_admin flag to profiles to easily check admin status
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS is_admin boolean DEFAULT false;

-- Update existing single-user companies to make that user an admin
UPDATE profiles p
SET is_admin = true
WHERE company_id IN (
  SELECT company_id
  FROM profiles
  GROUP BY company_id
  HAVING COUNT(*) = 1
);

-- Update companies table to set admin_user_id for single-user companies
UPDATE companies c
SET admin_user_id = (
  SELECT id FROM profiles WHERE company_id = c.id AND is_admin = true LIMIT 1
)
WHERE admin_user_id IS NULL;

-- Create function to check if company registration is complete
CREATE OR REPLACE FUNCTION is_company_registration_complete(company_id_param uuid)
RETURNS boolean AS $$
DECLARE
  company_record companies%ROWTYPE;
BEGIN
  SELECT * INTO company_record FROM companies WHERE id = company_id_param;
  
  IF company_record IS NULL THEN
    RETURN false;
  END IF;
  
  -- Check if required fields are filled
  IF company_record.name IS NULL OR trim(company_record.name) = '' THEN
    RETURN false;
  END IF;
  
  -- Check tax ID based on country
  IF company_record.country_code = 'BR' THEN
    IF company_record.cnpj_cpf IS NULL OR trim(company_record.cnpj_cpf) = '' THEN
      RETURN false;
    END IF;
  ELSE
    IF company_record.vat_number IS NULL OR trim(company_record.vat_number) = '' THEN
      RETURN false;
    END IF;
  END IF;
  
  RETURN true;
END;
$$ LANGUAGE plpgsql;

-- Create index for faster admin lookups
CREATE INDEX IF NOT EXISTS idx_profiles_is_admin ON profiles(is_admin) WHERE is_admin = true;
CREATE INDEX IF NOT EXISTS idx_companies_admin_user_id ON companies(admin_user_id);
CREATE INDEX IF NOT EXISTS idx_companies_is_active ON companies(is_active);
