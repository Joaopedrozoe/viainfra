
-- CONSOLIDAÇÃO DEFINITIVA - ORDEM CORRETA

-- 1. Primeiro, mover mensagens das conversas que serão deletadas
UPDATE messages 
SET conversation_id = '48c99f83-925c-407f-8b78-60b77ee45311'
WHERE conversation_id = '7ec05c5f-a247-4a2c-b247-66cae8556e23';

UPDATE messages 
SET conversation_id = 'e39568c3-4a86-477e-a706-22e2d9f5010e'
WHERE conversation_id = '61f827f0-cac1-492c-9421-ed6d1264be9b';

-- 2. Deletar conversas que apontam para contatos que serão removidos
DELETE FROM conversations WHERE id IN (
  '7ec05c5f-a247-4a2c-b247-66cae8556e23',
  '61f827f0-cac1-492c-9421-ed6d1264be9b'
);

-- 3. PRIMEIRO deletar contato que tem o telefone da Suh (para liberar o telefone)
DELETE FROM contacts WHERE id = '6f0ae6ca-77f7-49ac-8191-27154e903776';

-- 4. Deletar contato duplicado @lid da Joicy
DELETE FROM contacts WHERE id = '53521813-200b-42f7-9eb4-b968b600a6ef';

-- 5. AGORA atualizar Suh com o telefone correto (já liberado)
UPDATE contacts 
SET phone = '5511958035461',
    metadata = jsonb_set(
      COALESCE(metadata, '{}'::jsonb),
      '{remoteJid}',
      '"5511958035461@s.whatsapp.net"'
    ),
    updated_at = now()
WHERE id = '60741116-417d-448b-9d9f-6b491c7c10f5';

-- 6. Atualizar Joicy com dados corretos
UPDATE contacts 
SET name = 'Joicy Oliveira',
    phone = '5511991593841',
    metadata = jsonb_set(
      COALESCE(metadata, '{}'::jsonb),
      '{remoteJid}',
      '"5511991593841@s.whatsapp.net"'
    ),
    updated_at = now()
WHERE id = 'a16394fc-ec0d-47b3-8c3c-ac735612ab0a';

-- 7. Atualizar timestamps das conversas
UPDATE conversations SET updated_at = now() WHERE id = '48c99f83-925c-407f-8b78-60b77ee45311';
UPDATE conversations SET updated_at = now() WHERE id = 'e39568c3-4a86-477e-a706-22e2d9f5010e';
