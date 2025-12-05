
-- Atualizar updated_at das conversas para refletir a data da última mensagem real
UPDATE conversations c
SET updated_at = COALESCE(
  (SELECT MAX(m.created_at) FROM messages m WHERE m.conversation_id = c.id),
  c.updated_at
)
WHERE c.channel = 'whatsapp';
