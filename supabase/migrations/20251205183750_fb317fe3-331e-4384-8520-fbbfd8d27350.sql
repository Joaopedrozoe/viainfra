-- 1. Fechar todas as instâncias exceto TESTE2
UPDATE whatsapp_instances 
SET connection_state = 'close', status = 'disconnected'
WHERE instance_name != 'TESTE2';

-- 2. Garantir que TESTE2 está ativa
UPDATE whatsapp_instances 
SET connection_state = 'open', status = 'connected'
WHERE instance_name = 'TESTE2';

-- 3. Deletar mensagens de conversas que não são do TESTE2
DELETE FROM messages 
WHERE conversation_id IN (
  SELECT c.id FROM conversations c
  WHERE c.channel = 'whatsapp' 
  AND c.metadata->>'instance_name' IS NOT NULL 
  AND c.metadata->>'instance_name' != 'TESTE2'
);

-- 4. Deletar conversas que não são do TESTE2
DELETE FROM conversations 
WHERE channel = 'whatsapp' 
AND metadata->>'instance_name' IS NOT NULL 
AND metadata->>'instance_name' != 'TESTE2';

-- 5. Deletar contatos órfãos (sem conversas)
DELETE FROM contacts 
WHERE id NOT IN (SELECT DISTINCT contact_id FROM conversations WHERE contact_id IS NOT NULL);