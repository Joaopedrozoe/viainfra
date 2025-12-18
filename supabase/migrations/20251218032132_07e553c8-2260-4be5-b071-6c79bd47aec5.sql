
-- Delete messages from conversations created today (corrupted)
DELETE FROM messages 
WHERE conversation_id IN (
  SELECT id FROM conversations 
  WHERE company_id = 'da17735c-5a76-4797-b338-f6e63a7b3f8b' 
    AND channel = 'whatsapp'
    AND created_at::date = '2025-12-18'
);

-- Delete conversations created today (corrupted)
DELETE FROM conversations 
WHERE company_id = 'da17735c-5a76-4797-b338-f6e63a7b3f8b' 
  AND channel = 'whatsapp'
  AND created_at::date = '2025-12-18';

-- Delete contacts created today without conversations (orphans)
DELETE FROM contacts 
WHERE company_id = 'da17735c-5a76-4797-b338-f6e63a7b3f8b' 
  AND created_at::date = '2025-12-18'
  AND id NOT IN (SELECT DISTINCT contact_id FROM conversations WHERE contact_id IS NOT NULL);
