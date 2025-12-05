
-- FORCE cleanup - delete all non-TESTE2 WhatsApp conversations explicitly
-- Step 1: Disable wrong instances
UPDATE whatsapp_instances 
SET status = 'disconnected', connection_state = 'close'
WHERE instance_name IN ('JUNIORCORRETOR', 'TINFO', 'TESTE', 'teste', 'VIAINFRA', 'VIAINFRA2', 'TESTE CONEXÃO AUTONOMA');

-- Step 2: Delete messages from JUNIORCORRETOR conversations
DELETE FROM messages 
WHERE conversation_id IN (
  SELECT id FROM conversations 
  WHERE metadata->>'instanceName' = 'JUNIORCORRETOR'
);

-- Step 3: Delete JUNIORCORRETOR conversations
DELETE FROM conversations 
WHERE metadata->>'instanceName' = 'JUNIORCORRETOR';

-- Step 4: Delete messages from TINFO conversations
DELETE FROM messages 
WHERE conversation_id IN (
  SELECT id FROM conversations 
  WHERE metadata->>'instanceName' = 'TINFO'
);

-- Step 5: Delete TINFO conversations
DELETE FROM conversations 
WHERE metadata->>'instanceName' = 'TINFO';

-- Step 6: Delete messages from any other non-TESTE2 WhatsApp conversations
DELETE FROM messages 
WHERE conversation_id IN (
  SELECT id FROM conversations 
  WHERE channel = 'whatsapp'
  AND (metadata->>'instanceName' IS NULL OR metadata->>'instanceName' NOT IN ('TESTE2'))
);

-- Step 7: Delete other non-TESTE2 WhatsApp conversations
DELETE FROM conversations 
WHERE channel = 'whatsapp'
AND (metadata->>'instanceName' IS NULL OR metadata->>'instanceName' NOT IN ('TESTE2'));

-- Step 8: Clean orphan contacts
DELETE FROM contacts
WHERE id NOT IN (
  SELECT DISTINCT contact_id FROM conversations 
  WHERE contact_id IS NOT NULL
);
