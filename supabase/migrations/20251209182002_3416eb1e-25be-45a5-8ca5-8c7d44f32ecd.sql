
-- 1. Remover remoteJid @lid do contato errado (joicy almeida com phone 5511557566874)
-- Esse contato é OUTRO, não é a Joicy Oliveira (5511991593841)
UPDATE contacts 
SET metadata = metadata - 'remoteJid',
    updated_at = now()
WHERE id = 'bcb28e4e-0696-4bd7-9825-edcc38da5a59';

-- 2. Deletar conversa duplicada criada para @lid
DELETE FROM conversations WHERE id = 'cd90ff0c-3ea9-4496-a768-d4621a5f0b31';

-- 3. Atualizar contato principal da Joicy Oliveira com nome correto e remoteJid correto
UPDATE contacts 
SET name = 'Joicy Oliveira',
    metadata = jsonb_set(COALESCE(metadata, '{}'::jsonb), '{remoteJid}', '"5511991593841@s.whatsapp.net"'),
    updated_at = now()
WHERE id = 'a16394fc-ec0d-47b3-8c3c-ac735612ab0a';

-- 4. CRÍTICO: Resetar bot_state para "start" na conversa principal
UPDATE conversations 
SET status = 'open',
    metadata = '{"bot_triggered": false, "bot_state": {"currentNodeId": "start", "collectedData": {}}}'::jsonb,
    updated_at = now()
WHERE id = '48c99f83-925c-407f-8b78-60b77ee45311';
