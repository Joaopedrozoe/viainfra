-- Add missing UPDATE policy if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'contacts' 
    AND policyname = 'Users can update contacts from their company'
  ) THEN
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
  END IF;
END $$;

-- Add missing DELETE policy if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'contacts' 
    AND policyname = 'Users can delete contacts from their company'
  ) THEN
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
  END IF;
END $$;

-- Add public insert policy for web bot (critical for chat-bot functionality)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'contacts' 
    AND policyname = 'Allow public web bot to create contacts'
  ) THEN
    CREATE POLICY "Allow public web bot to create contacts"
    ON public.contacts
    FOR INSERT
    TO anon
    WITH CHECK (
      company_id IS NOT NULL
    );
  END IF;
END $$;