
-- Deletar TODAS as mensagens duplicadas que aparecem em mais de uma conversa
-- Primeiro identificar messageIds que aparecem em múltiplas conversas
DELETE FROM messages
WHERE id IN (
  SELECT m.id
  FROM messages m
  INNER JOIN (
    SELECT metadata->>'messageId' as msg_id
    FROM messages 
    WHERE metadata->>'messageId' IS NOT NULL
    GROUP BY metadata->>'messageId'
    HAVING COUNT(DISTINCT conversation_id) > 1
  ) dup ON m.metadata->>'messageId' = dup.msg_id
);

-- Atualizar timestamps das conversas baseado na última mensagem real
UPDATE conversations c
SET updated_at = COALESCE(sub.last_msg, c.created_at)
FROM (
  SELECT conversation_id, MAX(created_at) as last_msg
  FROM messages
  GROUP BY conversation_id
) sub
WHERE c.id = sub.conversation_id;

-- Conversas sem mensagens: usar created_at
UPDATE conversations
SET updated_at = created_at
WHERE id NOT IN (SELECT DISTINCT conversation_id FROM messages WHERE conversation_id IS NOT NULL);
