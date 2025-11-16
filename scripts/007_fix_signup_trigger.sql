-- Drop the existing trigger and function
drop trigger if exists on_auth_user_created on auth.users;
drop function if exists public.handle_new_user();

-- Enhanced function to create both profile and company
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_company_id uuid;
  v_company_name text;
begin
  -- Get company name from metadata
  v_company_name := new.raw_user_meta_data ->> 'company_name';
  
  -- Create company if company_name is provided
  if v_company_name is not null and v_company_name != '' then
    insert into public.companies (name)
    values (v_company_name)
    returning id into v_company_id;
  end if;

  -- Create profile
  insert into public.profiles (id, email, full_name, role, company_id)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'full_name', null),
    coalesce(new.raw_user_meta_data ->> 'role', 'client'),
    v_company_id
  )
  on conflict (id) do nothing;

  return new;
end;
$$;

-- Recreate the trigger
create trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute function public.handle_new_user();
