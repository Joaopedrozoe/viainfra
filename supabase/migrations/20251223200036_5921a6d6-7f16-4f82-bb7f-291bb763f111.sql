-- Corrigir o updated_at de TODAS as conversas para corresponder à última mensagem
-- Isso garante ordenação correta no inbox

UPDATE conversations c
SET updated_at = (
  SELECT MAX(m.created_at)
  FROM messages m
  WHERE m.conversation_id = c.id
)
WHERE EXISTS (
  SELECT 1 FROM messages m WHERE m.conversation_id = c.id
);

-- Para conversas sem mensagens, manter created_at
UPDATE conversations c
SET updated_at = c.created_at
WHERE NOT EXISTS (
  SELECT 1 FROM messages m WHERE m.conversation_id = c.id
);