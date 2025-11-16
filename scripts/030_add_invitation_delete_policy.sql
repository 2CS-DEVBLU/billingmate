-- Add DELETE policy for user_invitations to allow company admins to cancel invitations

-- Drop existing policies if they exist (for idempotency)
DROP POLICY IF EXISTS "Company admins can delete their company invitations" ON user_invitations;

-- Allow company admins to delete invitations for their company
CREATE POLICY "Company admins can delete their company invitations"
ON user_invitations
FOR DELETE
TO authenticated
USING (
  company_id IN (
    SELECT company_id 
    FROM profiles 
    WHERE id = auth.uid() 
    AND is_admin = true
  )
);
