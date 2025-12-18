-- Drop the problematic policy
DROP POLICY IF EXISTS "Admins can insert profiles to their company" ON public.profiles;

-- Create a security definer function to check if user is admin
CREATE OR REPLACE FUNCTION public.is_admin(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = _user_id 
    AND role = 'admin'
  );
$$;

-- Recreate the INSERT policy using the security definer function
CREATE POLICY "Admins can insert profiles to their company"
ON public.profiles
FOR INSERT
WITH CHECK (
  company_id IN (SELECT public.get_user_company_ids(auth.uid()))
  AND public.is_admin(auth.uid())
);