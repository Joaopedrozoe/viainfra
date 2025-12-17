-- Delete the incorrectly imported data from the latest bulk import
-- This removes conversations, messages, and contacts that were imported at 2025-12-17 19:57:40

-- First delete messages from these conversations
DELETE FROM messages 
WHERE conversation_id IN (
  SELECT id FROM conversations 
  WHERE company_id = 'da17735c-5a76-4797-b338-f6e63a7b3f8b'
  AND metadata->>'importedAt' = '2025-12-17 19:57:40.701259+00'
);

-- Then delete the conversations
DELETE FROM conversations 
WHERE company_id = 'da17735c-5a76-4797-b338-f6e63a7b3f8b'
AND metadata->>'importedAt' = '2025-12-17 19:57:40.701259+00';

-- Delete orphaned contacts (contacts without any conversation)
DELETE FROM contacts
WHERE company_id = 'da17735c-5a76-4797-b338-f6e63a7b3f8b'
AND metadata->>'source' LIKE 'whatsapp_import%'
AND id NOT IN (
  SELECT DISTINCT contact_id FROM conversations 
  WHERE contact_id IS NOT NULL
  AND company_id = 'da17735c-5a76-4797-b338-f6e63a7b3f8b'
);