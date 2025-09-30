-- Fix infinite recursion in profiles RLS policies
-- Create a security definer function to get user's company_id without triggering RLS

CREATE OR REPLACE FUNCTION public.get_user_company_id(_user_id uuid)
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT company_id
  FROM public.profiles
  WHERE user_id = _user_id
  LIMIT 1;
$$;

-- Drop the problematic policy
DROP POLICY IF EXISTS "Users can view profiles from their company" ON public.profiles;

-- Recreate it using the security definer function
CREATE POLICY "Users can view profiles from their company"
ON public.profiles
FOR SELECT
USING (
  company_id = public.get_user_company_id(auth.uid())
);