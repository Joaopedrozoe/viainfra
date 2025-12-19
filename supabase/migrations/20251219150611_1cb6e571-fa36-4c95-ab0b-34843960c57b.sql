
-- Atualizar updated_at para cada conversa individual usando FROM
UPDATE conversations 
SET updated_at = m.max_created_at
FROM (
  SELECT conversation_id, MAX(created_at) as max_created_at
  FROM messages
  GROUP BY conversation_id
) m
WHERE conversations.id = m.conversation_id
AND conversations.channel = 'whatsapp';
