-- Add unique_id field to companies table (immutable traceability ID)
alter table public.companies 
add column if not exists unique_id text unique;

-- Generate unique IDs for existing companies
update public.companies 
set unique_id = 'BM-' || upper(substring(md5(random()::text || clock_timestamp()::text) from 1 for 8))
where unique_id is null;

-- Make unique_id not null after populating existing records
alter table public.companies 
alter column unique_id set not null;

-- Add unique constraint on cnpj_cpf to prevent duplicate registrations
create unique index if not exists companies_cnpj_cpf_unique 
on public.companies (cnpj_cpf) 
where cnpj_cpf is not null and cnpj_cpf != '';

-- Create function to generate unique company ID
create or replace function public.generate_company_unique_id()
returns text
language plpgsql
as $$
begin
  return 'BM-' || upper(substring(md5(random()::text || clock_timestamp()::text) from 1 for 8));
end;
$$;

-- Add trigger to prevent unique_id changes after creation
create or replace function public.prevent_unique_id_change()
returns trigger
language plpgsql
as $$
begin
  if old.unique_id is distinct from new.unique_id then
    raise exception 'unique_id cannot be changed after creation';
  end if;
  return new;
end;
$$;

drop trigger if exists prevent_company_unique_id_change on public.companies;

create trigger prevent_company_unique_id_change
  before update on public.companies
  for each row
  execute function public.prevent_unique_id_change();

-- Update RLS policies to prevent non-admins from editing cnpj_cpf and unique_id
drop policy if exists "Admins can update companies" on public.companies;

create policy "Admins can update companies"
on public.companies
for update
to authenticated
using (is_admin())
with check (is_admin());

-- Add policy to allow users to view their company's unique_id but not modify it
drop policy if exists "Users can view their own company" on public.companies;

create policy "Users can view their own company"
on public.companies
for select
to authenticated
using (
  id in (
    select company_id from public.profiles where id = auth.uid()
  )
);
