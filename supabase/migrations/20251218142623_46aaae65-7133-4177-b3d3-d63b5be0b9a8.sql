
-- Corrigir timestamps baseado na última mensagem REAL de cada conversa
UPDATE conversations c
SET updated_at = sub.last_msg
FROM (
  SELECT conversation_id, MAX(created_at) as last_msg
  FROM messages
  GROUP BY conversation_id
) sub
WHERE c.id = sub.conversation_id
AND sub.last_msg IS NOT NULL;
