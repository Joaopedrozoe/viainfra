
-- Conversations: allow SELECT/UPDATE via profile.company_id OR company_access
DROP POLICY IF EXISTS "Users can view conversations from their company" ON public.conversations;
CREATE POLICY "Users can view conversations from their company"
ON public.conversations
FOR SELECT
TO authenticated
USING (
  company_id IN (SELECT company_id FROM public.profiles WHERE user_id = auth.uid())
  OR company_id IN (SELECT company_id FROM public.company_access WHERE user_id = auth.uid())
);

DROP POLICY IF EXISTS "Users can update conversations from their company" ON public.conversations;
CREATE POLICY "Users can update conversations from their company"
ON public.conversations
FOR UPDATE
TO authenticated
USING (
  company_id IN (SELECT company_id FROM public.profiles WHERE user_id = auth.uid())
  OR company_id IN (SELECT company_id FROM public.company_access WHERE user_id = auth.uid())
);

-- Messages: same fix
DROP POLICY IF EXISTS "Users can view messages from their company conversations" ON public.messages;
CREATE POLICY "Users can view messages from their company conversations"
ON public.messages
FOR SELECT
TO authenticated
USING (
  conversation_id IN (
    SELECT id FROM public.conversations
    WHERE company_id IN (SELECT company_id FROM public.profiles WHERE user_id = auth.uid())
       OR company_id IN (SELECT company_id FROM public.company_access WHERE user_id = auth.uid())
  )
);

DROP POLICY IF EXISTS "Users can update messages from their company conversations" ON public.messages;
CREATE POLICY "Users can update messages from their company conversations"
ON public.messages
FOR UPDATE
TO authenticated
USING (
  conversation_id IN (
    SELECT id FROM public.conversations
    WHERE company_id IN (SELECT company_id FROM public.profiles WHERE user_id = auth.uid())
       OR company_id IN (SELECT company_id FROM public.company_access WHERE user_id = auth.uid())
  )
);
