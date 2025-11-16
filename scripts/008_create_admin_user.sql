-- Create admin user without email confirmation
-- This script safely handles existing admin users by cleaning up first

-- Delete any existing admin user and related records first
DO $$
DECLARE
  existing_user_id uuid;
  existing_company_id uuid;
BEGIN
  -- Find existing user
  SELECT id INTO existing_user_id 
  FROM auth.users 
  WHERE email = 'admin@billingmate.com';
  
  IF existing_user_id IS NOT NULL THEN
    -- Get company ID before deletion
    SELECT company_id INTO existing_company_id
    FROM profiles
    WHERE id = existing_user_id;
    
    -- Delete in correct order (respecting foreign keys)
    DELETE FROM auth.identities WHERE user_id = existing_user_id;
    DELETE FROM profiles WHERE id = existing_user_id;
    DELETE FROM auth.users WHERE id = existing_user_id;
    
    -- Delete company if it exists
    IF existing_company_id IS NOT NULL THEN
      DELETE FROM companies WHERE id = existing_company_id;
    END IF;
  END IF;
END $$;

-- Now create fresh records with fixed UUIDs
INSERT INTO companies (id, name, industry, company_size)
VALUES (
  'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
  'BillingMate Admin',
  'SaaS',
  'Small (1-50)'
);

-- Create the admin user in auth.users (bypassing email confirmation)
-- Password: admin123 (you can change this after first login)
INSERT INTO auth.users (
  id,
  instance_id,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at,
  raw_app_meta_data,
  raw_user_meta_data,
  is_super_admin,
  role,
  aud,
  confirmation_token,
  recovery_token
)
VALUES (
  'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
  '00000000-0000-0000-0000-000000000000',
  'admin@billingmate.com',
  crypt('admin123', gen_salt('bf')),
  NOW(),
  NOW(),
  NOW(),
  '{"provider":"email","providers":["email"]}',
  '{"company_name":"BillingMate Admin","role":"admin"}',
  false,
  'authenticated',
  'authenticated',
  '',
  ''
);

-- Create identity record
-- Added provider_id field required by Supabase auth.identities table
INSERT INTO auth.identities (
  id,
  user_id,
  identity_data,
  provider,
  provider_id,
  last_sign_in_at,
  created_at,
  updated_at
)
VALUES (
  'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
  'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
  jsonb_build_object('sub', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'email', 'admin@billingmate.com'),
  'email',
  'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
  NOW(),
  NOW(),
  NOW()
);

-- Create the admin profile
INSERT INTO profiles (id, email, role, full_name, company_id)
VALUES (
  'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
  'admin@billingmate.com',
  'admin',
  'Platform Administrator',
  'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'
);

-- Verify the admin user was created
SELECT 
  u.email,
  u.email_confirmed_at,
  p.role,
  p.full_name,
  c.name as company_name
FROM auth.users u
LEFT JOIN profiles p ON p.id = u.id
LEFT JOIN companies c ON c.id = p.company_id
WHERE u.email = 'admin@billingmate.com';
