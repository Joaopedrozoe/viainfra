
-- 1. Mover as 2 mensagens da conversa duplicada @lid para a conversa correta
UPDATE messages 
SET conversation_id = '61f827f0-cac1-492c-9421-ed6d1264be9b'
WHERE conversation_id = 'f91ecaee-92f8-4947-8c0d-c18db142bc11';

-- 2. Deletar a conversa duplicada
DELETE FROM conversations WHERE id = 'f91ecaee-92f8-4947-8c0d-c18db142bc11';

-- 3. Deletar o contato duplicado @lid
DELETE FROM contacts WHERE id = 'eb5d15d5-4d84-422a-a284-a3780fa1c857';

-- 4. Atualizar timestamp da conversa consolidada
UPDATE conversations 
SET updated_at = now()
WHERE id = '61f827f0-cac1-492c-9421-ed6d1264be9b';
