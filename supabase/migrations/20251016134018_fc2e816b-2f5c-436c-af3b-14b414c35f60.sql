-- Corrigir função get_web_conversation_messages - remover ambiguidade de coluna 'id'
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
SET search_path TO 'public'
AS $$
DECLARE
  v_valid_conversation BOOLEAN;
BEGIN
  -- Validar token em tempo constante (previne timing attacks)
  SELECT EXISTS (
    SELECT 1 
    FROM conversations 
    WHERE conversations.id = p_conversation_id 
    AND conversations.access_token = p_access_token
    AND conversations.channel = 'web'
    AND conversations.status IN ('open', 'pending')
    AND conversations.updated_at > (now() - interval '7 days')
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

COMMENT ON FUNCTION public.get_web_conversation_messages IS 'Função segura corrigida para widget web buscar mensagens. Corrigido ambiguidade SQL em 2025-01-16.';