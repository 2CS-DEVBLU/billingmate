-- Add VAT field and plan metadata to companies table
ALTER TABLE public.companies
ADD COLUMN IF NOT EXISTS vat_number text,
ADD COLUMN IF NOT EXISTS country_code text DEFAULT 'BR',
ADD COLUMN IF NOT EXISTS is_registration_complete boolean DEFAULT false;

-- Add plan limits and usage tracking to subscriptions table
ALTER TABLE public.subscriptions
ADD COLUMN IF NOT EXISTS max_integrations integer DEFAULT 1,
ADD COLUMN IF NOT EXISTS max_cloud_spend numeric(12, 2) DEFAULT 5000,
ADD COLUMN IF NOT EXISTS max_analysis_months integer DEFAULT 3,
ADD COLUMN IF NOT EXISTS ai_recommendations_enabled boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS trial_end_date timestamp with time zone;

-- Update existing trial subscriptions with proper limits
UPDATE public.subscriptions
SET 
  max_integrations = 1,
  max_cloud_spend = 5000,
  max_analysis_months = 3,
  ai_recommendations_enabled = false
WHERE plan_type = 'trial';

-- Add function to check if company registration is complete
CREATE OR REPLACE FUNCTION check_company_registration_complete()
RETURNS TRIGGER AS $$
BEGIN
  -- Check if Brazil (BR) or other country
  IF NEW.country_code = 'BR' THEN
    -- Brazilian company needs CNPJ/CPF
    NEW.is_registration_complete := (
      NEW.name IS NOT NULL AND 
      NEW.cnpj_cpf IS NOT NULL AND 
      trim(NEW.cnpj_cpf) != ''
    );
  ELSE
    -- Other countries need VAT
    NEW.is_registration_complete := (
      NEW.name IS NOT NULL AND 
      NEW.vat_number IS NOT NULL AND 
      trim(NEW.vat_number) != ''
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-update registration status
DROP TRIGGER IF EXISTS update_registration_status ON public.companies;
CREATE TRIGGER update_registration_status
  BEFORE INSERT OR UPDATE ON public.companies
  FOR EACH ROW
  EXECUTE FUNCTION check_company_registration_complete();

-- Add index for faster plan lookups
CREATE INDEX IF NOT EXISTS idx_subscriptions_plan_type ON public.subscriptions(plan_type);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON public.subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_companies_registration_complete ON public.companies(is_registration_complete);

COMMENT ON COLUMN companies.vat_number IS 'VAT/Tax ID for non-Brazilian companies';
COMMENT ON COLUMN companies.country_code IS 'ISO country code (BR for Brazil, US, etc.)';
COMMENT ON COLUMN companies.is_registration_complete IS 'Auto-calculated: true if required tax info is provided';
COMMENT ON COLUMN subscriptions.max_integrations IS 'Maximum number of cloud provider integrations allowed';
COMMENT ON COLUMN subscriptions.max_cloud_spend IS 'Maximum monthly cloud spend allowed in USD';
COMMENT ON COLUMN subscriptions.max_analysis_months IS 'Maximum months of historical data analysis';
COMMENT ON COLUMN subscriptions.ai_recommendations_enabled IS 'Whether AI recommendations are available';
