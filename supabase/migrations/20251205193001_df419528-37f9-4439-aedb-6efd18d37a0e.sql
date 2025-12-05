
-- LIMPEZA COMPLETA E DEFINITIVA - Force exclusivo TESTE2
-- 1. Desativar TODAS as instâncias exceto TESTE2
UPDATE whatsapp_instances 
SET status = 'disconnected', 
    connection_state = 'close'
WHERE instance_name != 'TESTE2';

-- 2. Deletar TODAS as mensagens de conversas WhatsApp que NÃO são TESTE2
DELETE FROM messages 
WHERE conversation_id IN (
  SELECT id FROM conversations 
  WHERE channel = 'whatsapp' 
  AND (
    metadata IS NULL 
    OR metadata->>'instanceName' IS NULL 
    OR metadata->>'instanceName' != 'TESTE2'
  )
);

-- 3. Deletar TODAS as conversas WhatsApp que NÃO são TESTE2
DELETE FROM conversations 
WHERE channel = 'whatsapp' 
AND (
  metadata IS NULL 
  OR metadata->>'instanceName' IS NULL 
  OR metadata->>'instanceName' != 'TESTE2'
);

-- 4. Limpar contatos órfãos
DELETE FROM contacts 
WHERE id NOT IN (SELECT DISTINCT contact_id FROM conversations WHERE contact_id IS NOT NULL);
