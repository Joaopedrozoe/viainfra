-- Delete all conversations that have 0 messages (empty conversations created by broken import)
DELETE FROM conversations 
WHERE id NOT IN (
  SELECT DISTINCT conversation_id FROM messages WHERE conversation_id IS NOT NULL
);

-- Also clean up any orphaned contacts that have no conversations
-- This is optional but keeps the database clean
-- DELETE FROM contacts WHERE id NOT IN (
--   SELECT DISTINCT contact_id FROM conversations WHERE contact_id IS NOT NULL
-- );