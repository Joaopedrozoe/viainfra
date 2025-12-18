
-- Mover o áudio das 16:05 (19:05:26 UTC) do "Gerente Claro" para o "Fabrício"
-- A mensagem com id '40ff372d-e3df-4f50-b510-8dea8aa37658' deveria estar no Fabrício
UPDATE messages
SET conversation_id = '5c15432d-f614-4e1e-b229-7ccc7d61f835'
WHERE id = '40ff372d-e3df-4f50-b510-8dea8aa37658';

-- Atualizar updated_at da conversa do Fabrício para refletir nova última mensagem
UPDATE conversations
SET updated_at = '2025-12-18 19:05:26+00'
WHERE id = '5c15432d-f614-4e1e-b229-7ccc7d61f835';

-- Atualizar updated_at do Gerente Claro para a nova última mensagem (áudio às 18:44:25)
UPDATE conversations
SET updated_at = '2025-12-18 18:44:25+00'
WHERE id = '10076e35-5184-4008-82e3-d2dd0d30a2f7';
