
-- 1. Deletar mensagens das conversas incorretas (JUNIORCORRETOR e sem instanceName)
DELETE FROM messages
WHERE conversation_id IN (
  SELECT id FROM conversations
  WHERE channel = 'whatsapp'
  AND (
    metadata->>'instanceName' = 'JUNIORCORRETOR'
    OR metadata->>'instanceName' IS NULL
  )
);

-- 2. Deletar as conversas incorretas
DELETE FROM conversations
WHERE channel = 'whatsapp'
AND (
  metadata->>'instanceName' = 'JUNIORCORRETOR'
  OR metadata->>'instanceName' IS NULL
);

-- 3. Deletar contatos órfãos (sem conversas)
DELETE FROM contacts
WHERE id NOT IN (
  SELECT DISTINCT contact_id FROM conversations WHERE contact_id IS NOT NULL
)
AND company_id = 'da17735c-5a76-4797-b338-f6e63a7b3f8b';

-- 4. Desconectar instâncias que não são TESTE2 para evitar imports errados
UPDATE whatsapp_instances
SET connection_state = 'close', status = 'disconnected'
WHERE instance_name IN ('JUNIORCORRETOR', 'TINFO')
AND company_id = 'da17735c-5a76-4797-b338-f6e63a7b3f8b';
