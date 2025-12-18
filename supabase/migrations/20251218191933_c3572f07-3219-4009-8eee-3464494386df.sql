-- Atualizar updated_at das conversas para refletir última mensagem
UPDATE conversations c
SET updated_at = subquery.max_created_at
FROM (
  SELECT m.conversation_id, MAX(m.created_at) as max_created_at
  FROM messages m
  JOIN conversations conv ON m.conversation_id = conv.id
  WHERE conv.company_id = 'da17735c-5a76-4797-b338-f6e63a7b3f8b'
  AND conv.channel = 'whatsapp'
  AND conv.archived = false
  GROUP BY m.conversation_id
) subquery
WHERE c.id = subquery.conversation_id;

-- Deletar conversa VIAINFRA-RH duplicada sem mensagens
DELETE FROM conversations 
WHERE id = '1f0bdbec-659d-46b2-9af8-985c39e2d406';