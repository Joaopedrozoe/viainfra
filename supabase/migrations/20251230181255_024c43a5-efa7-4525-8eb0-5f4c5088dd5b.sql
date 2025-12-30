
-- Remover mensagens duplicadas restantes do Yago (mesmo content, mesmo timestamp)
WITH duplicates AS (
  SELECT id, content, created_at,
         ROW_NUMBER() OVER (PARTITION BY content, DATE_TRUNC('minute', created_at) ORDER BY id) as rn
  FROM messages
  WHERE conversation_id = '61f82363-6d0b-496e-ba6d-8dc39b60a570'
    AND created_at > '2025-12-30 17:00:00'
)
DELETE FROM messages
WHERE id IN (SELECT id FROM duplicates WHERE rn > 1);

-- Atualizar timestamp da conversa do Yago
UPDATE conversations
SET updated_at = NOW()
WHERE id = '61f82363-6d0b-496e-ba6d-8dc39b60a570';

-- Atualizar timestamp da conversa da Flávia
UPDATE conversations
SET updated_at = NOW()
WHERE id = '7d994378-6a3e-46a5-b188-c349beab6e71';
