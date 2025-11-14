-- Insert demo companies
insert into public.companies (id, name, industry, company_size)
values
  ('11111111-1111-1111-1111-111111111111', 'Acme Corporation', 'Technology', '50-200'),
  ('22222222-2222-2222-2222-222222222222', 'Global Ventures Inc', 'Finance', '200-1000'),
  ('33333333-3333-3333-3333-333333333333', 'StartupXYZ', 'SaaS', '10-50')
on conflict (id) do nothing;

-- Note: Profiles will be auto-created via trigger when users sign up
-- The following is just for reference of what admin users might look like

-- Insert demo cloud accounts
insert into public.cloud_accounts (company_id, provider, account_name, account_id, monthly_spend)
values
  ('11111111-1111-1111-1111-111111111111', 'aws', 'Production AWS', '123456789012', 15420.50),
  ('11111111-1111-1111-1111-111111111111', 'azure', 'Azure Development', 'sub-azure-001', 8750.25),
  ('22222222-2222-2222-2222-222222222222', 'aws', 'AWS Main Account', '987654321098', 42350.80),
  ('22222222-2222-2222-2222-222222222222', 'gcp', 'GCP Analytics', 'gcp-proj-456', 12890.45),
  ('33333333-3333-3333-3333-333333333333', 'aws', 'Startup AWS', '555666777888', 3250.00)
on conflict do nothing;

-- Insert demo cost data (last 30 days)
do $$
declare
  account_id uuid;
  day_offset int;
  base_cost numeric;
begin
  -- Generate cost data for each cloud account
  for account_id, base_cost in 
    select id, monthly_spend / 30 from public.cloud_accounts
  loop
    for day_offset in 0..29 loop
      insert into public.cost_data (cloud_account_id, date, service_name, cost, usage_quantity, usage_unit)
      values
        (account_id, current_date - day_offset, 'EC2', base_cost * 0.4 * (1 + (random() * 0.2 - 0.1)), random() * 100, 'hours'),
        (account_id, current_date - day_offset, 'RDS', base_cost * 0.2 * (1 + (random() * 0.2 - 0.1)), random() * 50, 'hours'),
        (account_id, current_date - day_offset, 'S3', base_cost * 0.15 * (1 + (random() * 0.2 - 0.1)), random() * 1000, 'GB'),
        (account_id, current_date - day_offset, 'Lambda', base_cost * 0.1 * (1 + (random() * 0.2 - 0.1)), random() * 10000, 'invocations'),
        (account_id, current_date - day_offset, 'CloudWatch', base_cost * 0.05 * (1 + (random() * 0.2 - 0.1)), random() * 500, 'requests'),
        (account_id, current_date - day_offset, 'Data Transfer', base_cost * 0.1 * (1 + (random() * 0.2 - 0.1)), random() * 100, 'GB');
    end loop;
  end loop;
end $$;

-- Insert demo recommendations
insert into public.recommendations (cloud_account_id, title, description, potential_savings, priority, status)
select 
  id,
  'Rightsize overprovisioned EC2 instances',
  'Analysis shows that 15 EC2 instances are consistently running at less than 30% CPU utilization. Downsizing these instances could reduce costs significantly.',
  monthly_spend * 0.12,
  'high',
  'open'
from public.cloud_accounts
where provider = 'aws'
union all
select 
  id,
  'Enable S3 Intelligent-Tiering',
  'Your S3 buckets contain data that hasn''t been accessed in over 90 days. Moving this to cheaper storage tiers could save costs.',
  monthly_spend * 0.08,
  'medium',
  'open'
from public.cloud_accounts
union all
select 
  id,
  'Purchase Reserved Instances for steady workloads',
  'Your usage patterns show consistent compute needs. Reserved Instances could provide 40-60% savings compared to on-demand pricing.',
  monthly_spend * 0.25,
  'high',
  'in_progress'
from public.cloud_accounts
where monthly_spend > 10000
union all
select 
  id,
  'Delete unattached EBS volumes',
  'Found 8 EBS volumes that are not attached to any instances and haven''t been used in 60+ days.',
  monthly_spend * 0.03,
  'low',
  'open'
from public.cloud_accounts
where provider = 'aws';

-- Insert demo alerts
insert into public.alerts (company_id, alert_type, severity, title, message, is_read)
select 
  company_id,
  'budget_exceeded',
  'critical',
  'Monthly budget exceeded',
  'Your cloud spending for ' || account_name || ' has exceeded the monthly budget by 15%.',
  false
from public.cloud_accounts
where monthly_spend > 15000
union all
select 
  company_id,
  'anomaly_detected',
  'warning',
  'Unusual spending spike detected',
  'We detected a 45% increase in EC2 costs compared to your 7-day average.',
  false
from public.cloud_accounts
union all
select 
  company_id,
  'recommendation',
  'info',
  'New cost optimization opportunities available',
  'We found 4 new recommendations that could save you up to $2,500/month.',
  false
from public.cloud_accounts;
