
-- Delete empty conversations (no messages) for VIAINFRA company
DELETE FROM conversations
WHERE channel = 'whatsapp'
AND company_id = 'da17735c-5a76-4797-b338-f6e63a7b3f8b'
AND NOT EXISTS (SELECT 1 FROM messages m WHERE m.conversation_id = conversations.id);
