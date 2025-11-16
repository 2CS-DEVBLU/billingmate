-- Add cloud integration configuration table
create table if not exists public.cloud_integrations (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  provider text not null, -- 'digitalocean', 'aws', 'azure', 'datadog'
  provider_name text not null,
  api_key text, -- encrypted API keys
  api_token text,
  account_identifier text,
  is_active boolean default true,
  is_enabled boolean default true, -- whether this provider is generally available
  last_sync timestamp with time zone,
  config jsonb, -- additional configuration data
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now(),
  unique(company_id, provider)
);

-- Update cloud_accounts table to support more providers
alter table public.cloud_accounts 
  add column if not exists provider_display_name text,
  add column if not exists integration_id uuid references public.cloud_integrations(id) on delete set null;

-- Add RLS policies for cloud_integrations
alter table public.cloud_integrations enable row level security;

create policy "Users can view their company's integrations"
  on public.cloud_integrations for select
  using (
    company_id in (
      select company_id from public.profiles where id = auth.uid()
    )
  );

create policy "Users can manage their company's integrations"
  on public.cloud_integrations for all
  using (
    company_id in (
      select company_id from public.profiles where id = auth.uid()
    )
  );

create policy "Admins can manage all integrations"
  on public.cloud_integrations for all
  using (is_admin());

-- Create indexes
create index if not exists idx_cloud_integrations_company_id on public.cloud_integrations(company_id);
create index if not exists idx_cloud_integrations_provider on public.cloud_integrations(provider);
create index if not exists idx_cloud_accounts_integration_id on public.cloud_accounts(integration_id);
