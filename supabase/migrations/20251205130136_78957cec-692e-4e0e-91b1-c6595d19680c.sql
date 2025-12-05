-- Fix: Update each conversation's updated_at to match its actual last message timestamp
UPDATE conversations c
SET updated_at = sub.last_msg
FROM (
  SELECT conversation_id, MAX(created_at) as last_msg
  FROM messages
  GROUP BY conversation_id
) sub
WHERE c.id = sub.conversation_id
AND c.company_id = 'da17735c-5a76-4797-b338-f6e63a7b3f8b';