
-- Atualizar updated_at das conversas para refletir a data da última mensagem real
UPDATE conversations c
SET updated_at = (
  SELECT MAX(m.created_at) 
  FROM messages m 
  WHERE m.conversation_id = c.id
)
WHERE EXISTS (
  SELECT 1 FROM messages m WHERE m.conversation_id = c.id
)
AND c.channel = 'whatsapp';
