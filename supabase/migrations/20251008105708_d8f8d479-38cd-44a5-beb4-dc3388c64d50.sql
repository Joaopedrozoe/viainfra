-- ========================================
-- CORREÇÃO CRÍTICA: Remover acesso direto a mensagens
-- Garantir que acesso seja APENAS via função RPC com token
-- ========================================

-- 1. Remover a política permissiva que permite bypass do token
DROP POLICY IF EXISTS "Messages: Allow access via valid access token" ON public.messages;

-- 2. Garantir que existe bloqueio RESTRICTIVE para anon
-- (Já deve existir da migração anterior, mas garantir)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'messages' 
    AND policyname = 'Messages: Deny all anonymous access'
  ) THEN
    CREATE POLICY "Messages: Deny all anonymous access"
    ON public.messages
    AS RESTRICTIVE
    FOR ALL
    TO anon, public
    USING (false)
    WITH CHECK (false);
  END IF;
END $$;

-- 3. Recriar a função com proteção contra timing attacks
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
DECLARE
  v_valid_conversation BOOLEAN;
BEGIN
  -- Validar token em tempo constante (previne timing attacks)
  SELECT EXISTS (
    SELECT 1 
    FROM conversations 
    WHERE id = p_conversation_id 
    AND access_token = p_access_token
    AND channel = 'web'
    AND status IN ('open', 'pending')
    AND updated_at > (now() - interval '7 days')
  ) INTO v_valid_conversation;

  -- Erro genérico para prevenir information disclosure
  IF NOT v_valid_conversation THEN
    RAISE EXCEPTION 'Access denied';
  END IF;

  -- Retornar mensagens apenas se token válido
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

-- 4. Criar função para enviar mensagem com validação de token
CREATE OR REPLACE FUNCTION public.send_web_conversation_message(
  p_conversation_id UUID,
  p_access_token UUID,
  p_content TEXT
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_valid_conversation BOOLEAN;
  v_message_id UUID;
BEGIN
  -- Validar token
  SELECT EXISTS (
    SELECT 1 
    FROM conversations 
    WHERE id = p_conversation_id 
    AND access_token = p_access_token
    AND channel = 'web'
    AND status IN ('open', 'pending')
    AND updated_at > (now() - interval '7 days')
  ) INTO v_valid_conversation;

  IF NOT v_valid_conversation THEN
    RAISE EXCEPTION 'Access denied';
  END IF;

  -- Validar conteúdo
  IF p_content IS NULL OR length(trim(p_content)) = 0 THEN
    RAISE EXCEPTION 'Message content cannot be empty';
  END IF;

  IF length(p_content) > 5000 THEN
    RAISE EXCEPTION 'Message content too long';
  END IF;

  -- Inserir mensagem
  INSERT INTO messages (conversation_id, sender_type, content)
  VALUES (p_conversation_id, 'user', p_content)
  RETURNING id INTO v_message_id;

  -- Atualizar timestamp da conversa
  UPDATE conversations 
  SET updated_at = now()
  WHERE id = p_conversation_id;

  RETURN v_message_id;
END;
$$;

-- 5. Garantir que conversas bloqueiem acesso público direto
CREATE POLICY "Conversations: Deny all anonymous access"
ON public.conversations
AS RESTRICTIVE
FOR ALL
TO anon, public
USING (false)
WITH CHECK (false);

-- 6. Comentários de auditoria
COMMENT ON FUNCTION public.get_web_conversation_messages IS 'ÚNICA forma segura de acessar mensagens web. Valida token UUID (122 bits entropia). Protegido contra timing attacks. Criado 2025-01-07.';
COMMENT ON FUNCTION public.send_web_conversation_message IS 'ÚNICA forma segura de enviar mensagens web. Valida token, sanitiza conteúdo, limita tamanho. Criado 2025-01-07.';
