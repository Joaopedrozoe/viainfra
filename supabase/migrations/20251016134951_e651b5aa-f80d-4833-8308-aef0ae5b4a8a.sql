-- Criar trigger para atualizar updated_at da conversa quando uma mensagem for inserida
CREATE OR REPLACE FUNCTION public.update_conversation_timestamp()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Atualizar o campo updated_at da conversa relacionada
  UPDATE conversations
  SET updated_at = NEW.created_at
  WHERE id = NEW.conversation_id;
  
  RETURN NEW;
END;
$$;

-- Criar o trigger que dispara após inserção de mensagem
DROP TRIGGER IF EXISTS trigger_update_conversation_timestamp ON messages;
CREATE TRIGGER trigger_update_conversation_timestamp
  AFTER INSERT ON messages
  FOR EACH ROW
  EXECUTE FUNCTION update_conversation_timestamp();

COMMENT ON FUNCTION public.update_conversation_timestamp IS 'Atualiza timestamp da conversa quando uma nova mensagem é criada. Criado em 2025-01-16 para corrigir ordenação de conversas.';