-- Drop existing policies that cause infinite recursion
drop policy if exists "Admins can view all profiles" on public.profiles;
drop policy if exists "Admins can view all companies" on public.companies;
drop policy if exists "Admins can insert companies" on public.companies;
drop policy if exists "Admins can update companies" on public.companies;
drop policy if exists "Admins can manage all cloud accounts" on public.cloud_accounts;
drop policy if exists "Admins can manage all cost data" on public.cost_data;
drop policy if exists "Admins can manage all recommendations" on public.recommendations;
drop policy if exists "Admins can manage all alerts" on public.alerts;
drop policy if exists "Admins can manage all subscriptions" on public.subscriptions;

-- Create a helper function to check admin role without recursion
create or replace function public.is_admin()
returns boolean
language sql
security definer
stable
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
$$;

-- Recreate admin policies using the helper function
create policy "Admins can view all profiles"
  on public.profiles for select
  using (public.is_admin());

create policy "Admins can view all companies"
  on public.companies for select
  using (public.is_admin());

create policy "Admins can insert companies"
  on public.companies for insert
  with check (public.is_admin());

create policy "Admins can update companies"
  on public.companies for update
  using (public.is_admin());

create policy "Admins can manage all cloud accounts"
  on public.cloud_accounts for all
  using (public.is_admin());

create policy "Admins can manage all cost data"
  on public.cost_data for all
  using (public.is_admin());

create policy "Admins can manage all recommendations"
  on public.recommendations for all
  using (public.is_admin());

create policy "Admins can manage all alerts"
  on public.alerts for all
  using (public.is_admin());

create policy "Admins can manage all subscriptions"
  on public.subscriptions for all
  using (public.is_admin());
