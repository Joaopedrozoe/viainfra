-- Corrigir timestamps das conversas baseado na última mensagem REAL de cada uma
UPDATE conversations c
SET updated_at = (
  SELECT MAX(created_at) 
  FROM messages m 
  WHERE m.conversation_id = c.id
)
WHERE c.channel = 'whatsapp'
AND EXISTS (SELECT 1 FROM messages m WHERE m.conversation_id = c.id);