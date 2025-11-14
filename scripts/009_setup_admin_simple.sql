-- Simple admin setup: Updates existing user or creates new one
-- This handles the case where admin@billingmate.com already exists

DO $$
DECLARE
  admin_user_id uuid;
  admin_company_id uuid;
BEGIN
  -- Check if admin user already exists
  SELECT id INTO admin_user_id 
  FROM auth.users 
  WHERE email = 'admin@billingmate.com';
  
  -- If user exists, just update their role to admin
  IF admin_user_id IS NOT NULL THEN
    -- Update profile to admin role
    UPDATE profiles 
    SET role = 'admin', full_name = 'Platform Administrator'
    WHERE id = admin_user_id;
    
    -- Update password and confirm email
    UPDATE auth.users
    SET 
      encrypted_password = crypt('admin123', gen_salt('bf')),
      email_confirmed_at = NOW(),
      updated_at = NOW()
    WHERE id = admin_user_id;
    
    RAISE NOTICE 'Updated existing user admin@billingmate.com to admin role';
  ELSE
    -- User doesn't exist, create everything from scratch
    admin_user_id := 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb';
    admin_company_id := 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
    
    -- Create company
    INSERT INTO companies (id, name, industry, company_size)
    VALUES (admin_company_id, 'BillingMate Admin', 'SaaS', 'Small (1-50)');
    
    -- Create auth user
    INSERT INTO auth.users (
      id, instance_id, email, encrypted_password, email_confirmed_at,
      created_at, updated_at, raw_app_meta_data, raw_user_meta_data,
      is_super_admin, role, aud, confirmation_token, recovery_token
    )
    VALUES (
      admin_user_id, '00000000-0000-0000-0000-000000000000',
      'admin@billingmate.com', crypt('admin123', gen_salt('bf')), NOW(),
      NOW(), NOW(),
      '{"provider":"email","providers":["email"]}',
      '{"company_name":"BillingMate Admin","role":"admin"}',
      false, 'authenticated', 'authenticated', '', ''
    );
    
    -- Create identity
    INSERT INTO auth.identities (
      id, user_id, identity_data, provider, provider_id,
      last_sign_in_at, created_at, updated_at
    )
    VALUES (
      admin_user_id, admin_user_id,
      jsonb_build_object('sub', admin_user_id::text, 'email', 'admin@billingmate.com'),
      'email', admin_user_id::text,
      NOW(), NOW(), NOW()
    );
    
    -- Create profile
    INSERT INTO profiles (id, email, role, full_name, company_id)
    VALUES (
      admin_user_id, 'admin@billingmate.com', 'admin',
      'Platform Administrator', admin_company_id
    );
    
    RAISE NOTICE 'Created new admin user admin@billingmate.com';
  END IF;
END $$;

-- Verify the result
SELECT 
  u.email,
  u.email_confirmed_at IS NOT NULL as email_confirmed,
  p.role,
  p.full_name,
  c.name as company_name
FROM auth.users u
LEFT JOIN profiles p ON p.id = u.id
LEFT JOIN companies c ON c.id = p.company_id
WHERE u.email = 'admin@billingmate.com';
