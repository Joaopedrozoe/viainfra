-- Deletar mensagens de áudio duplicadas inseridas simultaneamente em conversas erradas
DELETE FROM messages 
WHERE id IN (
  SELECT m.id
  FROM messages m
  WHERE m.content = '🎵 Áudio'
  AND m.created_at >= '2025-12-18 14:00:00'
  AND m.created_at < '2025-12-18 14:01:00'
  AND m.metadata->>'messageId' = 'ACE4AFB26035F833C6083E3E88E595FF'
);

-- Atualizar timestamps das conversas baseado na última mensagem real
UPDATE conversations c
SET updated_at = sub.last_msg
FROM (
  SELECT conversation_id, MAX(created_at) as last_msg
  FROM messages
  GROUP BY conversation_id
) sub
WHERE c.id = sub.conversation_id;