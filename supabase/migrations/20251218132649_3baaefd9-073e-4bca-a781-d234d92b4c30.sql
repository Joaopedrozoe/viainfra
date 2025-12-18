-- Deletar conversas sem mensagens (conversas vazias criadas erroneamente)
DELETE FROM conversations 
WHERE id NOT IN (
  SELECT DISTINCT conversation_id FROM messages WHERE conversation_id IS NOT NULL
);