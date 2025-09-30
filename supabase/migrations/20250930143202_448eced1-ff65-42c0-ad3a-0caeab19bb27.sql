-- Add rate limiting comments and improve RLS for web conversations
-- Note: Rate limiting should be implemented at application level or using edge functions

-- Add policy to view profiles within company (needed for team presence)
CREATE POLICY "Users can view profiles from their company"
ON public.profiles
FOR SELECT
USING (
  company_id IN (
    SELECT company_id FROM profiles WHERE user_id = auth.uid()
  )
);

-- Add DELETE policies for user_presence (cleanup on logout)
CREATE POLICY "Users can delete their own presence"
ON public.user_presence
FOR DELETE
USING (user_id = auth.uid());

-- Add policies for internal messages read tracking
CREATE POLICY "Users can update read status on internal messages"
ON public.internal_messages
FOR UPDATE
USING (
  conversation_id IN (
    SELECT id FROM internal_conversations WHERE auth.uid() = ANY(participants)
  )
);

-- Add update policy for internal conversations
CREATE POLICY "Users can update their internal conversations"
ON public.internal_conversations
FOR UPDATE
USING (
  auth.uid() = ANY(participants) AND
  company_id IN (
    SELECT company_id FROM profiles WHERE user_id = auth.uid()
  )
);

-- Add comments about LGPD compliance
COMMENT ON TABLE profiles IS 'Dados pessoais - LGPD Art. 5º - requer consentimento e direito ao esquecimento';
COMMENT ON TABLE contacts IS 'Dados de contatos - LGPD Art. 7º - base legal: legítimo interesse para atendimento';
COMMENT ON COLUMN profiles.email IS 'Dado pessoal sensível - LGPD';
COMMENT ON COLUMN profiles.phone IS 'Dado pessoal sensível - LGPD';
COMMENT ON COLUMN contacts.email IS 'Dado pessoal - LGPD';
COMMENT ON COLUMN contacts.phone IS 'Dado pessoal - LGPD';