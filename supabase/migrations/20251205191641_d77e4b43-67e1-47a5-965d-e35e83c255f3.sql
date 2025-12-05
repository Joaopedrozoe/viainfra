
-- CRITICAL: Clean up conversations from wrong instances
-- Only TESTE2 should have conversations

-- First, disable TINFO and JUNIORCORRETOR instances
UPDATE whatsapp_instances 
SET status = 'disconnected', connection_state = 'close'
WHERE instance_name IN ('TINFO', 'JUNIORCORRETOR')
AND company_id = 'da17735c-5a76-4797-b338-f6e63a7b3f8b';

-- Delete messages from conversations that belong to wrong instances
DELETE FROM messages 
WHERE conversation_id IN (
  SELECT c.id FROM conversations c
  WHERE c.company_id = 'da17735c-5a76-4797-b338-f6e63a7b3f8b'
  AND c.channel = 'whatsapp'
  AND (c.metadata->>'instanceName') IN ('TINFO', 'JUNIORCORRETOR', 'TESTE', 'VIAINFRA', 'VIAINFRA2')
);

-- Delete conversations from wrong instances
DELETE FROM conversations 
WHERE company_id = 'da17735c-5a76-4797-b338-f6e63a7b3f8b'
AND channel = 'whatsapp'
AND (metadata->>'instanceName') IN ('TINFO', 'JUNIORCORRETOR', 'TESTE', 'VIAINFRA', 'VIAINFRA2');

-- Delete orphan contacts (contacts with no conversations)
DELETE FROM contacts
WHERE company_id = 'da17735c-5a76-4797-b338-f6e63a7b3f8b'
AND id NOT IN (
  SELECT DISTINCT contact_id FROM conversations 
  WHERE contact_id IS NOT NULL 
  AND company_id = 'da17735c-5a76-4797-b338-f6e63a7b3f8b'
);
