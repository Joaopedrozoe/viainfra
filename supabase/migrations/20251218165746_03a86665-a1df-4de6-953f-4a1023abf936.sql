
-- Fix ordering: conversations without messages should have old timestamps
UPDATE conversations 
SET updated_at = '2020-01-01 00:00:00+00'
WHERE channel = 'whatsapp'
AND company_id = 'da17735c-5a76-4797-b338-f6e63a7b3f8b'
AND NOT EXISTS (
  SELECT 1 FROM messages WHERE messages.conversation_id = conversations.id
);
