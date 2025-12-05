
-- FINAL CLEANUP: Remove absolutely all WhatsApp conversations that are not from TESTE2
DELETE FROM messages WHERE conversation_id IN (
  SELECT id FROM conversations 
  WHERE company_id = 'da17735c-5a76-4797-b338-f6e63a7b3f8b'
  AND channel = 'whatsapp'
  AND COALESCE(metadata->>'instanceName', '') != 'TESTE2'
);

DELETE FROM conversations 
WHERE company_id = 'da17735c-5a76-4797-b338-f6e63a7b3f8b'
AND channel = 'whatsapp'
AND COALESCE(metadata->>'instanceName', '') != 'TESTE2';

-- Clean orphan contacts
DELETE FROM contacts
WHERE company_id = 'da17735c-5a76-4797-b338-f6e63a7b3f8b'
AND id NOT IN (
  SELECT DISTINCT contact_id FROM conversations 
  WHERE contact_id IS NOT NULL 
  AND company_id = 'da17735c-5a76-4797-b338-f6e63a7b3f8b'
);

-- Disable all instances except TESTE2
UPDATE whatsapp_instances 
SET status = 'disconnected', connection_state = 'close'
WHERE company_id = 'da17735c-5a76-4797-b338-f6e63a7b3f8b'
AND instance_name != 'TESTE2';
