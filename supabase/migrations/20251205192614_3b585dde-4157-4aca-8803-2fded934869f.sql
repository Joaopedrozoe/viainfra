-- DIRECT FORCE DELETE - Remove conversations by instanceName
-- Use explicit text comparison
DO $$
DECLARE
  deleted_msgs INT;
  deleted_convs INT;
  deleted_contacts INT;
BEGIN
  -- Delete messages from JUNIORCORRETOR conversations
  DELETE FROM messages 
  WHERE conversation_id IN (
    SELECT id FROM conversations 
    WHERE channel = 'whatsapp' 
    AND metadata->>'instanceName' = 'JUNIORCORRETOR'
  );
  GET DIAGNOSTICS deleted_msgs = ROW_COUNT;
  RAISE NOTICE 'Deleted % messages from JUNIORCORRETOR', deleted_msgs;
  
  -- Delete JUNIORCORRETOR conversations
  DELETE FROM conversations 
  WHERE channel = 'whatsapp' 
  AND metadata->>'instanceName' = 'JUNIORCORRETOR';
  GET DIAGNOSTICS deleted_convs = ROW_COUNT;
  RAISE NOTICE 'Deleted % JUNIORCORRETOR conversations', deleted_convs;
  
  -- Delete messages from TINFO conversations
  DELETE FROM messages 
  WHERE conversation_id IN (
    SELECT id FROM conversations 
    WHERE channel = 'whatsapp' 
    AND metadata->>'instanceName' = 'TINFO'
  );
  
  -- Delete TINFO conversations
  DELETE FROM conversations 
  WHERE channel = 'whatsapp' 
  AND metadata->>'instanceName' = 'TINFO';
  
  -- Delete messages from TESTE conversations (not TESTE2)
  DELETE FROM messages 
  WHERE conversation_id IN (
    SELECT id FROM conversations 
    WHERE channel = 'whatsapp' 
    AND metadata->>'instanceName' = 'TESTE'
  );
  
  -- Delete TESTE conversations
  DELETE FROM conversations 
  WHERE channel = 'whatsapp' 
  AND metadata->>'instanceName' = 'TESTE';
  
  -- Clean orphan contacts
  DELETE FROM contacts 
  WHERE id NOT IN (SELECT DISTINCT contact_id FROM conversations WHERE contact_id IS NOT NULL);
  GET DIAGNOSTICS deleted_contacts = ROW_COUNT;
  RAISE NOTICE 'Cleaned up % orphan contacts', deleted_contacts;
END $$;