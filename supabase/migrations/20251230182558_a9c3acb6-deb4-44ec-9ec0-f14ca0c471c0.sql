
-- 1. Deletar mapeamento LID ERRADO (125091560067098 -> 5511918752320 ViaLogistic)
DELETE FROM lid_phone_mapping WHERE lid = '125091560067098' AND phone = '5511918752320';

-- 2. Mover mensagem "Ok" para conversa CORRETA da Flávia Financeiro
UPDATE messages 
SET conversation_id = '7d994378-6a3e-46a5-b188-c349beab6e71'
WHERE id = 'c4e94de3-7a49-48bd-b951-269486344341';

-- 3. Atualizar timestamp da conversa Flávia Financeiro
UPDATE conversations SET updated_at = NOW() WHERE id = '7d994378-6a3e-46a5-b188-c349beab6e71';

-- 4. Atualizar timestamp da conversa Flavia Oliveira (ViaLogistic) para ficar consistente
UPDATE conversations SET updated_at = NOW() - INTERVAL '1 hour' WHERE id = 'b64bfff8-7ac1-4845-a1ed-c230c9f23d9a';
