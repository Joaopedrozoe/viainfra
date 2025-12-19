-- Atualizar o updated_at das conversas baseado na última mensagem
-- Isso vai corrigir a ordenação no inbox

UPDATE conversations c
SET updated_at = COALESCE(
  (SELECT MAX(created_at) FROM messages m WHERE m.conversation_id = c.id),
  c.updated_at
)
WHERE c.channel = 'whatsapp'
AND c.id IN (
  SELECT DISTINCT c2.id 
  FROM conversations c2
  JOIN messages m2 ON m2.conversation_id = c2.id
  WHERE c2.channel = 'whatsapp'
  AND m2.created_at > c2.updated_at - INTERVAL '1 day'
);