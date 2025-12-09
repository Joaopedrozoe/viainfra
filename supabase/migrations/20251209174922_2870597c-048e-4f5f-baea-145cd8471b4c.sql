
-- 1. Atualizar o nome do contato correto (5511958035461) para "Joicy Oliveira"
UPDATE contacts 
SET name = 'Joicy Oliveira',
    metadata = jsonb_set(
      COALESCE(metadata, '{}'),
      '{remoteJid_lid}',
      '"122007689646323@lid"'
    ),
    updated_at = now()
WHERE id = '6f0ae6ca-77f7-49ac-8191-27154e903776';

-- 2. Mover as mensagens da conversa @lid para a conversa correta
UPDATE messages 
SET conversation_id = '61f827f0-cac1-492c-9421-ed6d1264be9b'
WHERE conversation_id = 'cdc57735-ccb0-46f2-a89e-1b36b0fac9b2';

-- 3. Deletar a conversa duplicada (do contato @lid)
DELETE FROM conversations WHERE id = 'cdc57735-ccb0-46f2-a89e-1b36b0fac9b2';

-- 4. Deletar o contato @lid duplicado
DELETE FROM contacts WHERE id = 'fbc0d56d-9c38-4be8-a8fc-78b1dd3549dd';

-- 5. Reabrir a conversa consolidada
UPDATE conversations 
SET status = 'open', 
    updated_at = now()
WHERE id = '61f827f0-cac1-492c-9421-ed6d1264be9b';
