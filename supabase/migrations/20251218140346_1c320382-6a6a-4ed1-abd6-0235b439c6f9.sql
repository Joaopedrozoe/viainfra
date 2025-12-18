-- Deletar mensagens "Opção inválida" duplicadas que foram criadas simultaneamente
DELETE FROM messages 
WHERE content LIKE 'Opção inválida%' 
AND created_at >= '2025-12-18 14:00:14'
AND created_at < '2025-12-18 14:00:15';

-- Atualizar updated_at das conversas baseado na última mensagem real
UPDATE conversations c
SET updated_at = (
  SELECT MAX(m.created_at)
  FROM messages m 
  WHERE m.conversation_id = c.id
)
WHERE EXISTS (
  SELECT 1 FROM messages m WHERE m.conversation_id = c.id
);