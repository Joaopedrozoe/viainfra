
-- Deletar TODAS as mensagens duplicadas do mecânico (messageId AC958B54BD7E2FA37368292A0C5A823A)
-- Elas foram inseridas em conversas erradas
DELETE FROM messages
WHERE metadata->>'messageId' = 'AC958B54BD7E2FA37368292A0C5A823A';

-- Corrigir timestamps das conversas baseado na última mensagem real RESTANTE
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
