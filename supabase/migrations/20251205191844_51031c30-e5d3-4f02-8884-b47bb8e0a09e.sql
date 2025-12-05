
-- CRITICAL CLEANUP: Remove ALL WhatsApp conversations except TESTE2
-- Keep web conversations intact

-- Step 1: Delete messages from non-TESTE2 WhatsApp conversations
DELETE FROM messages 
WHERE conversation_id IN (
  SELECT id FROM conversations 
  WHERE company_id = 'da17735c-5a76-4797-b338-f6e63a7b3f8b'
  AND channel = 'whatsapp'
  AND (
    metadata->>'instanceName' IS NULL 
    OR metadata->>'instanceName' != 'TESTE2'
  )
);

-- Step 2: Delete non-TESTE2 WhatsApp conversations
DELETE FROM conversations 
WHERE company_id = 'da17735c-5a76-4797-b338-f6e63a7b3f8b'
AND channel = 'whatsapp'
AND (
  metadata->>'instanceName' IS NULL 
  OR metadata->>'instanceName' != 'TESTE2'
);

-- Step 3: Delete orphan contacts (no conversations)
DELETE FROM contacts
WHERE company_id = 'da17735c-5a76-4797-b338-f6e63a7b3f8b'
AND id NOT IN (
  SELECT DISTINCT contact_id FROM conversations 
  WHERE contact_id IS NOT NULL 
  AND company_id = 'da17735c-5a76-4797-b338-f6e63a7b3f8b'
);
