
-- Deletar mensagens das conversas TINFO
DELETE FROM messages
WHERE conversation_id IN (
  SELECT id FROM conversations
  WHERE channel = 'whatsapp'
  AND metadata->>'instanceName' = 'TINFO'
);

-- Deletar as conversas TINFO
DELETE FROM conversations
WHERE channel = 'whatsapp'
AND metadata->>'instanceName' = 'TINFO';

-- Deletar contatos órfãos
DELETE FROM contacts
WHERE id NOT IN (
  SELECT DISTINCT contact_id FROM conversations WHERE contact_id IS NOT NULL
)
AND company_id = 'da17735c-5a76-4797-b338-f6e63a7b3f8b';
