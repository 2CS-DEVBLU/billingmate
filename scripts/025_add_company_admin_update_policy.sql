-- Add RLS policy for company admins to update their own company

-- Drop the restrictive policy if it exists
DROP POLICY IF EXISTS "Company admins can update their company" ON public.companies;

-- Create new policy that allows company admins to update their own company
CREATE POLICY "Company admins can update their company"
  ON public.companies
  FOR UPDATE
  USING (
    -- User must be authenticated
    auth.uid() IS NOT NULL
    AND (
      -- Either the user is a system admin
      public.is_admin()
      OR
      -- Or the user is a company admin for this company
      EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid()
        AND company_id = companies.id
        AND (company_account_role = 'admin' OR is_admin = true)
      )
    )
  );

-- Also ensure company admins can view their own company data
DROP POLICY IF EXISTS "Users can view their own company" ON public.companies;

CREATE POLICY "Users can view their own company"
  ON public.companies
  FOR SELECT
  USING (
    auth.uid() IS NOT NULL
    AND (
      -- System admin can see all
      public.is_admin()
      OR
      -- User can see their own company
      EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid()
        AND company_id = companies.id
      )
    )
  );
