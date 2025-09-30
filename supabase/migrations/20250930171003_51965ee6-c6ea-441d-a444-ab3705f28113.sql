-- Remove políticas públicas inseguras que expõem dados
-- Estas políticas não são necessárias pois o widget web usa edge function com SERVICE_ROLE

-- Remover política SELECT pública (CRÍTICO - expõe todas conversas web)
DROP POLICY IF EXISTS "Allow public to view web conversations" ON public.conversations;

-- Remover política INSERT pública para conversations (não usada - edge function usa SERVICE_ROLE)
DROP POLICY IF EXISTS "Allow public web conversations" ON public.conversations;

-- Remover política INSERT pública para messages (não usada - edge function usa SERVICE_ROLE)
DROP POLICY IF EXISTS "Allow public web messages" ON public.messages;

-- Adicionar política UPDATE para messages (permite agentes marcarem mensagens como lidas)
CREATE POLICY "Users can update messages from their company conversations" 
  ON public.messages 
  FOR UPDATE
  USING (
    conversation_id IN (
      SELECT id 
      FROM public.conversations 
      WHERE company_id IN (
        SELECT company_id 
        FROM public.profiles 
        WHERE user_id = auth.uid()
      )
    )
  );

-- Adicionar comentário explicativo
COMMENT ON TABLE public.conversations IS 'Conversas são acessadas por: 1) Usuários autenticados via RLS por company_id, 2) Widget web via edge function com SERVICE_ROLE';
COMMENT ON TABLE public.messages IS 'Mensagens são acessadas por: 1) Usuários autenticados via RLS por conversation company_id, 2) Widget web via edge function com SERVICE_ROLE';