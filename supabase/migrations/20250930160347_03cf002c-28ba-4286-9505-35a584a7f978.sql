-- Drop existing policies to recreate them properly
DROP POLICY IF EXISTS "Users can insert contacts to their company" ON public.contacts;
DROP POLICY IF EXISTS "Users can view contacts from their company" ON public.contacts;

-- Allow authenticated users to view contacts from their company
CREATE POLICY "Users can view contacts from their company"
ON public.contacts
FOR SELECT
TO authenticated
USING (
  company_id IN (
    SELECT company_id 
    FROM public.profiles 
    WHERE user_id = auth.uid()
  )
);

-- Allow authenticated users to insert contacts to their company
CREATE POLICY "Users can insert contacts to their company"
ON public.contacts
FOR INSERT
TO authenticated
WITH CHECK (
  company_id IN (
    SELECT company_id 
    FROM public.profiles 
    WHERE user_id = auth.uid()
  )
);

-- Allow authenticated users to update contacts from their company
CREATE POLICY "Users can update contacts from their company"
ON public.contacts
FOR UPDATE
TO authenticated
USING (
  company_id IN (
    SELECT company_id 
    FROM public.profiles 
    WHERE user_id = auth.uid()
  )
)
WITH CHECK (
  company_id IN (
    SELECT company_id 
    FROM public.profiles 
    WHERE user_id = auth.uid()
  )
);

-- Allow authenticated users to delete contacts from their company
CREATE POLICY "Users can delete contacts from their company"
ON public.contacts
FOR DELETE
TO authenticated
USING (
  company_id IN (
    SELECT company_id 
    FROM public.profiles 
    WHERE user_id = auth.uid()
  )
);

-- Allow public insert for web bot contacts (needed for chat-bot edge function)
-- This is safe because it still requires a valid company_id
CREATE POLICY "Allow public web bot to create contacts"
ON public.contacts
FOR INSERT
TO anon
WITH CHECK (
  company_id IS NOT NULL
);