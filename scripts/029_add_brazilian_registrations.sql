-- Add state and municipal registration fields for Brazilian companies
ALTER TABLE companies
ADD COLUMN IF NOT EXISTS state_registration TEXT,
ADD COLUMN IF NOT EXISTS municipal_registration TEXT;

COMMENT ON COLUMN companies.state_registration IS 'State Registration (Inscrição Estadual) for Brazilian companies';
COMMENT ON COLUMN companies.municipal_registration IS 'Municipal Registration (Inscrição Municipal) for Brazilian companies';
