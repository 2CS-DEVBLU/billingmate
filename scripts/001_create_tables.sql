-- Create companies table (for clients)
create table if not exists public.companies (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  industry text,
  company_size text,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Create profiles table (linked to auth.users)
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  full_name text,
  role text not null default 'client', -- 'admin' or 'client'
  company_id uuid references public.companies(id) on delete set null,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Create cloud_accounts table (AWS, Azure, GCP accounts)
create table if not exists public.cloud_accounts (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  provider text not null, -- 'aws', 'azure', 'gcp'
  account_name text not null,
  account_id text not null,
  monthly_spend numeric(10, 2) default 0,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Create cost_data table (historical cost data)
create table if not exists public.cost_data (
  id uuid primary key default gen_random_uuid(),
  cloud_account_id uuid not null references public.cloud_accounts(id) on delete cascade,
  date date not null,
  service_name text not null,
  cost numeric(10, 2) not null,
  usage_quantity numeric(15, 4),
  usage_unit text,
  created_at timestamp with time zone default now()
);

-- Create recommendations table (AI-generated cost optimization recommendations)
create table if not exists public.recommendations (
  id uuid primary key default gen_random_uuid(),
  cloud_account_id uuid not null references public.cloud_accounts(id) on delete cascade,
  title text not null,
  description text not null,
  potential_savings numeric(10, 2),
  priority text not null, -- 'high', 'medium', 'low'
  status text not null default 'open', -- 'open', 'in_progress', 'completed', 'dismissed'
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Create alerts table (budget alerts and anomaly detection)
create table if not exists public.alerts (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  alert_type text not null, -- 'budget_exceeded', 'anomaly_detected', 'recommendation'
  severity text not null, -- 'critical', 'warning', 'info'
  title text not null,
  message text not null,
  is_read boolean default false,
  created_at timestamp with time zone default now()
);

-- Create subscriptions table (for Stripe integration)
create table if not exists public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  stripe_subscription_id text unique,
  stripe_customer_id text,
  plan_type text not null, -- 'starter', 'professional', 'enterprise'
  status text not null default 'active', -- 'active', 'canceled', 'past_due'
  current_period_start timestamp with time zone,
  current_period_end timestamp with time zone,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Create indexes for better query performance
create index if not exists idx_profiles_company_id on public.profiles(company_id);
create index if not exists idx_profiles_role on public.profiles(role);
create index if not exists idx_cloud_accounts_company_id on public.cloud_accounts(company_id);
create index if not exists idx_cost_data_cloud_account_id on public.cost_data(cloud_account_id);
create index if not exists idx_cost_data_date on public.cost_data(date);
create index if not exists idx_recommendations_cloud_account_id on public.recommendations(cloud_account_id);
create index if not exists idx_recommendations_status on public.recommendations(status);
create index if not exists idx_alerts_company_id on public.alerts(company_id);
create index if not exists idx_subscriptions_company_id on public.subscriptions(company_id);
