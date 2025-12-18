-- Add INSERT policy for profiles table to allow admins to create users in their company
CREATE POLICY "Admins can insert profiles to their company"
ON public.profiles
FOR INSERT
WITH CHECK (
  company_id IN (SELECT public.get_user_company_ids(auth.uid()))
  AND EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() 
    AND role = 'admin'
    AND company_id IN (SELECT public.get_user_company_ids(auth.uid()))
  )
);