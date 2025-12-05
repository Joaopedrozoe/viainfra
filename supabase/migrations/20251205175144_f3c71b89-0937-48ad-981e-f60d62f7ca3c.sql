-- Limpar mensagens das conversas que NÃO são da instância TESTE2
DELETE FROM messages 
WHERE conversation_id IN (
  SELECT id FROM conversations 
  WHERE company_id = 'da17735c-5a76-4797-b338-f6e63a7b3f8b'
  AND channel = 'whatsapp'
  AND (metadata->>'instanceName' IS NULL OR metadata->>'instanceName' != 'TESTE2')
);

-- Limpar conversas que NÃO são da instância TESTE2
DELETE FROM conversations 
WHERE company_id = 'da17735c-5a76-4797-b338-f6e63a7b3f8b'
AND channel = 'whatsapp'
AND (metadata->>'instanceName' IS NULL OR metadata->>'instanceName' != 'TESTE2');

-- Limpar contatos órfãos (sem conversas associadas)
DELETE FROM contacts 
WHERE company_id = 'da17735c-5a76-4797-b338-f6e63a7b3f8b'
AND id NOT IN (SELECT DISTINCT contact_id FROM conversations WHERE contact_id IS NOT NULL);