-- Update this email to match the account you just created
-- Replace 'your-email@example.com' with your actual email

UPDATE profiles 
SET role = 'admin'
WHERE email = 'your-email@example.com';

-- Verify the change
SELECT email, role, full_name FROM profiles WHERE role = 'admin';
