-- Add new columns to companies table for comprehensive registration
ALTER TABLE public.companies
ADD COLUMN IF NOT EXISTS address text,
ADD COLUMN IF NOT EXISTS area_of_operation text,
ADD COLUMN IF NOT EXISTS cnpj_cpf text,
ADD COLUMN IF NOT EXISTS admin_user_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL;

-- Create index for admin user lookup
CREATE INDEX IF NOT EXISTS idx_companies_admin_user_id ON public.companies(admin_user_id);

-- Add a unique constraint for CNPJ/CPF to prevent duplicates
CREATE UNIQUE INDEX IF NOT EXISTS idx_companies_cnpj_cpf ON public.companies(cnpj_cpf) WHERE cnpj_cpf IS NOT NULL;

COMMENT ON COLUMN public.companies.address IS 'Company physical address';
COMMENT ON COLUMN public.companies.area_of_operation IS 'Primary area or sector of operation';
COMMENT ON COLUMN public.companies.cnpj_cpf IS 'Brazilian company identifier (CNPJ) or individual taxpayer ID (CPF)';
COMMENT ON COLUMN public.companies.admin_user_id IS 'Reference to the primary administrator user for this company';
