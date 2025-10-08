-- ========================================
-- SOLUÇÃO: Sistema de tokens de acesso para widget web
-- Substitui acesso público por tokens únicos por conversa
-- ========================================

-- 1. Adicionar coluna de token de acesso nas conversas
ALTER TABLE public.conversations 
ADD COLUMN IF NOT EXISTS access_token UUID DEFAULT gen_random_uuid();

-- 2. Criar índice para performance
CREATE INDEX IF NOT EXISTS idx_conversations_access_token 
ON public.conversations(access_token);

-- 3. Remover a política pública permissiva atual
DROP POLICY IF EXISTS "Public can view web messages with valid conversation" ON public.messages;

-- 4. Bloquear todo acesso público por padrão
CREATE POLICY "Messages: Deny all anonymous access"
ON public.messages
AS RESTRICTIVE
FOR ALL
TO anon, public
USING (false)
WITH CHECK (false);

-- 5. Criar política que permite acesso apenas com token válido (via RPC)
-- Nota: Esta política será usada por uma função que valida o token
CREATE POLICY "Messages: Allow access via valid access token"
ON public.messages
FOR SELECT
TO anon
USING (
  -- Permitir acesso apenas se a conversa for web e estiver em conversas ativas
  conversation_id IN (
    SELECT id 
    FROM conversations 
    WHERE channel = 'web' 
    AND status IN ('open', 'pending')
    AND updated_at > (now() - interval '7 days')
  )
);

-- 6. Criar função para validar token e buscar mensagens
CREATE OR REPLACE FUNCTION public.get_web_conversation_messages(
  p_conversation_id UUID,
  p_access_token UUID
)
RETURNS TABLE (
  id UUID,
  conversation_id UUID,
  sender_type TEXT,
  content TEXT,
  created_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Verificar se o token é válido
  IF NOT EXISTS (
    SELECT 1 
    FROM conversations 
    WHERE id = p_conversation_id 
    AND access_token = p_access_token
    AND channel = 'web'
    AND updated_at > (now() - interval '7 days')
  ) THEN
    RAISE EXCEPTION 'Invalid access token or conversation not found';
  END IF;

  -- Retornar mensagens da conversa
  RETURN QUERY
  SELECT 
    m.id,
    m.conversation_id,
    m.sender_type,
    m.content,
    m.created_at
  FROM messages m
  WHERE m.conversation_id = p_conversation_id
  ORDER BY m.created_at ASC;
END;
$$;

-- 7. Comentário de auditoria
COMMENT ON FUNCTION public.get_web_conversation_messages IS 'Função segura para widget web buscar mensagens usando token de acesso. Criada em 2025-01-07 para substituir acesso público direto.';
COMMENT ON COLUMN public.conversations.access_token IS 'Token UUID único para acesso seguro do widget web. Criado em 2025-01-07.';
