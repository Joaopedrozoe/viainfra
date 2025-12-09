
-- 1. Mover mensagens da conversa @lid para a conversa principal da Joicy
UPDATE messages 
SET conversation_id = '48c99f83-925c-407f-8b78-60b77ee45311'
WHERE conversation_id = '4143fbb1-65de-4661-9283-447088f4d82f';

-- 2. Deletar conversa duplicada @lid
DELETE FROM conversations WHERE id = '4143fbb1-65de-4661-9283-447088f4d82f';

-- 3. Deletar contato @lid duplicado
DELETE FROM contacts WHERE id = '3b9e409c-b92d-453c-8644-0eeafe8d05cc';

-- 4. Resetar bot_state para "start" e atualizar nome do contato principal
UPDATE contacts 
SET name = 'Joicy Oliveira',
    updated_at = now()
WHERE id = 'a16394fc-ec0d-47b3-8c3c-ac735612ab0a';

UPDATE conversations 
SET metadata = jsonb_set(
      jsonb_set(COALESCE(metadata, '{}'::jsonb), '{bot_triggered}', 'false'),
      '{bot_state}', '{"currentNodeId": "start", "collectedData": {}}'
    ),
    updated_at = now()
WHERE id = '48c99f83-925c-407f-8b78-60b77ee45311';
