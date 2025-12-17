-- Drop existing contacts RLS policies and recreate with correct multi-company support
DROP POLICY IF EXISTS "Users can view contacts from their company" ON public.contacts;
DROP POLICY IF EXISTS "Users can insert contacts to their company" ON public.contacts;
DROP POLICY IF EXISTS "Users can update contacts from their company" ON public.contacts;
DROP POLICY IF EXISTS "Users can delete contacts from their company" ON public.contacts;

-- Recreate with proper multi-company support (same pattern as conversations)
CREATE POLICY "Users can view contacts from their company" 
ON public.contacts 
FOR SELECT 
USING (company_id IN (
  SELECT profiles.company_id
  FROM profiles
  WHERE profiles.user_id = auth.uid()
));

CREATE POLICY "Users can insert contacts to their company" 
ON public.contacts 
FOR INSERT 
WITH CHECK (company_id IN (
  SELECT profiles.company_id
  FROM profiles
  WHERE profiles.user_id = auth.uid()
));

CREATE POLICY "Users can update contacts from their company" 
ON public.contacts 
FOR UPDATE 
USING (company_id IN (
  SELECT profiles.company_id
  FROM profiles
  WHERE profiles.user_id = auth.uid()
))
WITH CHECK (company_id IN (
  SELECT profiles.company_id
  FROM profiles
  WHERE profiles.user_id = auth.uid()
));

CREATE POLICY "Users can delete contacts from their company" 
ON public.contacts 
FOR DELETE 
USING (company_id IN (
  SELECT profiles.company_id
  FROM profiles
  WHERE profiles.user_id = auth.uid()
));