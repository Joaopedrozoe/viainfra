-- Create function to get ALL company IDs for a user (for multi-company support)
CREATE OR REPLACE FUNCTION public.get_user_company_ids(_user_id uuid)
RETURNS SETOF uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT company_id
  FROM public.profiles
  WHERE user_id = _user_id
  AND company_id IS NOT NULL;
$$;

-- Update the RLS policy to allow users to view profiles from ALL their companies
DROP POLICY IF EXISTS "Users can view profiles from their company" ON public.profiles;

CREATE POLICY "Users can view profiles from their company"
ON public.profiles
FOR SELECT
USING (company_id IN (SELECT public.get_user_company_ids(auth.uid())));