-- FORÇAR fechamento de TODAS as instâncias exceto TESTE2
UPDATE whatsapp_instances 
SET connection_state = 'close', status = 'disconnected'
WHERE instance_name IN ('TINFO', 'JUNIORCORRETOR', 'teste', 'TESTE', 'TESTE CONEXÃO AUTONOMA', 'VIAINFRA', 'VIAINFRA2');

-- Deletar TODAS as conversas e mensagens não relacionadas a TESTE2
-- Primeiro as mensagens
DELETE FROM messages 
WHERE conversation_id IN (
  SELECT id FROM conversations 
  WHERE channel = 'whatsapp' 
  AND (metadata->>'instance_name' IS NULL OR metadata->>'instance_name' != 'TESTE2')
);

-- Depois as conversas
DELETE FROM conversations 
WHERE channel = 'whatsapp' 
AND (metadata->>'instance_name' IS NULL OR metadata->>'instance_name' != 'TESTE2');

-- Deletar contatos órfãos
DELETE FROM contacts 
WHERE id NOT IN (SELECT DISTINCT contact_id FROM conversations WHERE contact_id IS NOT NULL);

-- Garantir que TESTE2 está marcada como ativa
UPDATE whatsapp_instances 
SET connection_state = 'open', status = 'connected', bot_enabled = true
WHERE instance_name = 'TESTE2';