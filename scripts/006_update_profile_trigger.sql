-- Drop the old trigger and function
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- Create improved function that handles company creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  new_company_id uuid;
BEGIN
  -- Check if user provided a company name in metadata
  IF NEW.raw_user_meta_data->>'company_name' IS NOT NULL THEN
    -- Create a new company
    INSERT INTO public.companies (name)
    VALUES (NEW.raw_user_meta_data->>'company_name')
    RETURNING id INTO new_company_id;
  END IF;

  -- Insert the user profile with company_id if available
  INSERT INTO public.profiles (id, full_name, role, company_id)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    COALESCE(NEW.raw_user_meta_data->>'role', 'client'),
    new_company_id
  );

  RETURN NEW;
END;
$$;

-- Recreate the trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
