-- REMOVER MENSAGENS DUPLICADAS mantendo apenas a mais antiga de cada
WITH duplicates AS (
  SELECT id, ROW_NUMBER() OVER (
    PARTITION BY conversation_id, content, DATE_TRUNC('minute', created_at)
    ORDER BY created_at ASC
  ) as rn
  FROM messages
  WHERE conversation_id IN (
    SELECT id FROM conversations
    WHERE company_id = 'da17735c-5a76-4797-b338-f6e63a7b3f8b'
  )
)
DELETE FROM messages
WHERE id IN (SELECT id FROM duplicates WHERE rn > 1);