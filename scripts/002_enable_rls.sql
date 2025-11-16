-- Enable Row Level Security on all tables
alter table public.companies enable row level security;
alter table public.profiles enable row level security;
alter table public.cloud_accounts enable row level security;
alter table public.cost_data enable row level security;
alter table public.recommendations enable row level security;
alter table public.alerts enable row level security;
alter table public.subscriptions enable row level security;

-- Profiles policies
create policy "Users can view their own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Users can update their own profile"
  on public.profiles for update
  using (auth.uid() = id);

create policy "Users can insert their own profile"
  on public.profiles for insert
  with check (auth.uid() = id);

-- Admins can view all profiles
create policy "Admins can view all profiles"
  on public.profiles for select
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  );

-- Companies policies
create policy "Users can view their own company"
  on public.companies for select
  using (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid() 
      and profiles.company_id = companies.id
    )
  );

create policy "Admins can view all companies"
  on public.companies for select
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  );

create policy "Admins can insert companies"
  on public.companies for insert
  with check (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  );

create policy "Admins can update companies"
  on public.companies for update
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  );

-- Cloud accounts policies
create policy "Users can view their company's cloud accounts"
  on public.cloud_accounts for select
  using (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid() 
      and profiles.company_id = cloud_accounts.company_id
    )
  );

create policy "Admins can manage all cloud accounts"
  on public.cloud_accounts for all
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  );

-- Cost data policies
create policy "Users can view their company's cost data"
  on public.cost_data for select
  using (
    exists (
      select 1 from public.profiles
      join public.cloud_accounts on profiles.company_id = cloud_accounts.company_id
      where profiles.id = auth.uid() 
      and cloud_accounts.id = cost_data.cloud_account_id
    )
  );

create policy "Admins can manage all cost data"
  on public.cost_data for all
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  );

-- Recommendations policies
create policy "Users can view their company's recommendations"
  on public.recommendations for select
  using (
    exists (
      select 1 from public.profiles
      join public.cloud_accounts on profiles.company_id = cloud_accounts.company_id
      where profiles.id = auth.uid() 
      and cloud_accounts.id = recommendations.cloud_account_id
    )
  );

create policy "Users can update their company's recommendations"
  on public.recommendations for update
  using (
    exists (
      select 1 from public.profiles
      join public.cloud_accounts on profiles.company_id = cloud_accounts.company_id
      where profiles.id = auth.uid() 
      and cloud_accounts.id = recommendations.cloud_account_id
    )
  );

create policy "Admins can manage all recommendations"
  on public.recommendations for all
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  );

-- Alerts policies
create policy "Users can view their company's alerts"
  on public.alerts for select
  using (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid() 
      and profiles.company_id = alerts.company_id
    )
  );

create policy "Users can update their company's alerts"
  on public.alerts for update
  using (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid() 
      and profiles.company_id = alerts.company_id
    )
  );

create policy "Admins can manage all alerts"
  on public.alerts for all
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  );

-- Subscriptions policies
create policy "Users can view their company's subscription"
  on public.subscriptions for select
  using (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid() 
      and profiles.company_id = subscriptions.company_id
    )
  );

create policy "Admins can manage all subscriptions"
  on public.subscriptions for all
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  );
