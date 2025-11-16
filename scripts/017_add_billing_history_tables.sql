-- Add detailed billing and resource tracking tables for 12-month history
create table if not exists public.billing_history (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  integration_id uuid not null references public.cloud_integrations(id) on delete cascade,
  billing_period date not null, -- month/year of billing
  total_cost numeric(10, 2) not null default 0,
  currency text default 'USD',
  raw_data jsonb, -- store the raw API response for audit
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now(),
  unique(integration_id, billing_period)
);

create table if not exists public.resource_costs (
  id uuid primary key default gen_random_uuid(),
  billing_history_id uuid not null references public.billing_history(id) on delete cascade,
  resource_type text not null, -- 'droplet', 'database', 'load_balancer', 'storage', etc.
  resource_id text, -- provider's resource ID
  resource_name text,
  cost numeric(10, 2) not null default 0,
  usage_hours numeric(10, 2),
  region text,
  size_slug text, -- instance size/type
  metadata jsonb, -- additional resource details
  created_at timestamp with time zone default now()
);

create table if not exists public.cost_anomalies (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  integration_id uuid not null references public.cloud_integrations(id) on delete cascade,
  detected_at timestamp with time zone default now(),
  resource_type text,
  expected_cost numeric(10, 2),
  actual_cost numeric(10, 2),
  variance_percent numeric(5, 2),
  severity text check (severity in ('low', 'medium', 'high', 'critical')),
  description text,
  is_resolved boolean default false,
  resolved_at timestamp with time zone
);

-- Enable RLS
alter table public.billing_history enable row level security;
alter table public.resource_costs enable row level security;
alter table public.cost_anomalies enable row level security;

-- RLS Policies for billing_history
create policy "Users can view their company's billing history"
  on public.billing_history for select
  using (
    company_id in (
      select company_id from public.profiles where id = auth.uid()
    )
  );

create policy "Admins can manage all billing history"
  on public.billing_history for all
  using (is_admin());

-- RLS Policies for resource_costs
create policy "Users can view their company's resource costs"
  on public.resource_costs for select
  using (
    billing_history_id in (
      select id from public.billing_history 
      where company_id in (
        select company_id from public.profiles where id = auth.uid()
      )
    )
  );

create policy "Admins can manage all resource costs"
  on public.resource_costs for all
  using (is_admin());

-- RLS Policies for cost_anomalies
create policy "Users can view their company's cost anomalies"
  on public.cost_anomalies for select
  using (
    company_id in (
      select company_id from public.profiles where id = auth.uid()
    )
  );

create policy "Admins can manage all cost anomalies"
  on public.cost_anomalies for all
  using (is_admin());

-- Create indexes for performance
create index if not exists idx_billing_history_company_id on public.billing_history(company_id);
create index if not exists idx_billing_history_integration_id on public.billing_history(integration_id);
create index if not exists idx_billing_history_period on public.billing_history(billing_period);
create index if not exists idx_resource_costs_billing_id on public.resource_costs(billing_history_id);
create index if not exists idx_resource_costs_type on public.resource_costs(resource_type);
create index if not exists idx_cost_anomalies_company_id on public.cost_anomalies(company_id);
create index if not exists idx_cost_anomalies_severity on public.cost_anomalies(severity);

-- Function to clean up old billing data (keep 12 months)
create or replace function cleanup_old_billing_data()
returns void
language plpgsql
security definer
as $$
begin
  delete from public.billing_history
  where billing_period < date_trunc('month', now() - interval '12 months');
end;
$$;
