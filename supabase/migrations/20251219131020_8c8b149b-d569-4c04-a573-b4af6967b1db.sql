-- Corrigir timestamps usando uma query mais direta
WITH last_messages AS (
  SELECT 
    conversation_id,
    MAX(created_at) as last_msg_time
  FROM messages
  GROUP BY conversation_id
)
UPDATE conversations c
SET updated_at = lm.last_msg_time
FROM last_messages lm
WHERE c.id = lm.conversation_id
AND c.channel = 'whatsapp';