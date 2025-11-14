-- Enhanced sign-up function with CNPJ/CPF validation and unique_id generation
drop trigger if exists on_auth_user_created on auth.users;
drop function if exists public.handle_new_user();

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_company_id uuid;
  v_company_name text;
  v_cnpj_cpf text;
  v_existing_company_id uuid;
  v_unique_id text;
begin
  -- Get company information from metadata
  v_company_name := new.raw_user_meta_data ->> 'company_name';
  v_cnpj_cpf := new.raw_user_meta_data ->> 'cnpj_cpf';
  
  -- Check if company with this CNPJ/CPF already exists
  if v_cnpj_cpf is not null and v_cnpj_cpf != '' then
    select id into v_existing_company_id 
    from public.companies 
    where cnpj_cpf = v_cnpj_cpf;
    
    if v_existing_company_id is not null then
      -- Company already exists, link user to existing company
      v_company_id := v_existing_company_id;
      
      raise notice 'User linked to existing company with CNPJ/CPF: %', v_cnpj_cpf;
    else
      -- Create new company with CNPJ/CPF and unique_id
      v_unique_id := generate_company_unique_id();
      
      insert into public.companies (name, cnpj_cpf, unique_id)
      values (v_company_name, v_cnpj_cpf, v_unique_id)
      returning id into v_company_id;
      
      raise notice 'New company created with unique_id: %', v_unique_id;
    end if;
  elsif v_company_name is not null and v_company_name != '' then
    -- Create company without CNPJ/CPF (can be added later by admin)
    v_unique_id := generate_company_unique_id();
    
    insert into public.companies (name, unique_id)
    values (v_company_name, v_unique_id)
    returning id into v_company_id;
    
    raise notice 'New company created without CNPJ/CPF, unique_id: %', v_unique_id;
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
