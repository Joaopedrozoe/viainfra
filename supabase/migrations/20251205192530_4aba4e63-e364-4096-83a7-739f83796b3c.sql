-- FORCE DELETE ALL non-TESTE2 WhatsApp conversations
-- Step 1: Delete messages from non-TESTE2 conversations
DELETE FROM messages 
WHERE conversation_id IN (
  SELECT id FROM conversations 
  WHERE channel = 'whatsapp' 
  AND (metadata->>'instanceName' IS NULL OR metadata->>'instanceName' != 'TESTE2')
);

-- Step 2: Delete conversations
DELETE FROM conversations 
WHERE channel = 'whatsapp' 
AND (metadata->>'instanceName' IS NULL OR metadata->>'instanceName' != 'TESTE2');

-- Step 3: Clean orphan contacts
DELETE FROM contacts 
WHERE id NOT IN (SELECT DISTINCT contact_id FROM conversations WHERE contact_id IS NOT NULL);