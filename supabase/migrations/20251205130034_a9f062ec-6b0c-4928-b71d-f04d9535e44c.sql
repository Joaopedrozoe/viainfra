-- Update conversations updated_at to match last message created_at
UPDATE conversations c
SET updated_at = (
  SELECT MAX(m.created_at)
  FROM messages m
  WHERE m.conversation_id = c.id
)
WHERE EXISTS (
  SELECT 1 FROM messages m WHERE m.conversation_id = c.id
)
AND company_id = 'da17735c-5a76-4797-b338-f6e63a7b3f8b';