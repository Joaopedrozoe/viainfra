-- Deletar conversas vazias (sem mensagens)
DELETE FROM conversations 
WHERE id IN (
  SELECT c.id FROM conversations c
  WHERE c.company_id = 'da17735c-5a76-4797-b338-f6e63a7b3f8b'
  AND c.channel = 'whatsapp'
  AND NOT EXISTS (SELECT 1 FROM messages m WHERE m.conversation_id = c.id)
);

-- Atualizar timestamps baseado na última mensagem real
UPDATE conversations c
SET updated_at = (
  SELECT MAX(m.created_at) 
  FROM messages m 
  WHERE m.conversation_id = c.id
)
WHERE c.company_id = 'da17735c-5a76-4797-b338-f6e63a7b3f8b'
AND c.channel = 'whatsapp'
AND EXISTS (SELECT 1 FROM messages m WHERE m.conversation_id = c.id);