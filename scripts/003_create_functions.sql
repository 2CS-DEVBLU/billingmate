-- Function to automatically create a profile when a user signs up
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name, role)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'full_name', null),
    coalesce(new.raw_user_meta_data ->> 'role', 'client')
  )
  on conflict (id) do nothing;

  return new;
end;
$$;

-- Trigger to call the function when a new user is created
drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute function public.handle_new_user();

-- Function to update the updated_at timestamp
create or replace function public.handle_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- Triggers for updated_at on relevant tables
create trigger handle_companies_updated_at
  before update on public.companies
  for each row
  execute function public.handle_updated_at();

create trigger handle_profiles_updated_at
  before update on public.profiles
  for each row
  execute function public.handle_updated_at();

create trigger handle_cloud_accounts_updated_at
  before update on public.cloud_accounts
  for each row
  execute function public.handle_updated_at();

create trigger handle_recommendations_updated_at
  before update on public.recommendations
  for each row
  execute function public.handle_updated_at();

create trigger handle_subscriptions_updated_at
  before update on public.subscriptions
  for each row
  execute function public.handle_updated_at();
