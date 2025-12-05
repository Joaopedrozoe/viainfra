
-- FINAL FORCED DELETION - Remove ALL non-TESTE2 WhatsApp conversations regardless
-- Using direct deletion without complex conditions

-- Get all non-TESTE2 WhatsApp conversation IDs
WITH bad_convs AS (
  SELECT id FROM conversations 
  WHERE channel = 'whatsapp' 
  AND metadata->>'instanceName' != 'TESTE2'
)
-- Delete messages first
DELETE FROM messages WHERE conversation_id IN (SELECT id FROM bad_convs);

-- Then delete conversations
DELETE FROM conversations 
WHERE channel = 'whatsapp' 
AND metadata->>'instanceName' != 'TESTE2';

-- Clean orphan contacts
DELETE FROM contacts 
WHERE id NOT IN (SELECT DISTINCT contact_id FROM conversations WHERE contact_id IS NOT NULL);
