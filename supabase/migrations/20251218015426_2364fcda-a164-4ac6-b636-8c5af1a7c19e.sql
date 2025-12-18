-- Update the get_user_company_id function to return the first profile by created_at
-- This ensures consistent behavior for users with multiple company profiles
-- Note: The real fix is that the frontend needs to query with company_id filter
-- but for RLS to work properly, we'll use the oldest company (original)

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
  ORDER BY created_at ASC
  LIMIT 1;
$$;