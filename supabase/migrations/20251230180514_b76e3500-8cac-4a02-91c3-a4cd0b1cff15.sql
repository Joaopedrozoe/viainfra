
-- 1. Mover mensagens da conversa duplicada para a conversa correta do Yago
UPDATE messages 
SET conversation_id = '61f82363-6d0b-496e-ba6d-8dc39b60a570'
WHERE conversation_id = '28ecf1ff-d551-4b65-9577-2d60cbf1a339';

-- 2. Deletar a conversa duplicada
DELETE FROM conversations WHERE id = '28ecf1ff-d551-4b65-9577-2d60cbf1a339';

-- 3. Deletar o contato "Sem Nome" duplicado
DELETE FROM contacts WHERE id = '228cc778-fb4c-412a-88ad-75f1128295c7';

-- 4. Criar mapeamento LID permanente para Yago (551120854990 é o telefone na conversa)
INSERT INTO lid_phone_mapping (lid, phone, contact_id, company_id, instance_name)
VALUES (
  '178576603263132',
  '551120854990',
  '315cc5d7-a6ad-4a8e-8b3f-91d65e3b0721',
  (SELECT company_id FROM conversations WHERE id = '61f82363-6d0b-496e-ba6d-8dc39b60a570'),
  'VIAINFRAOFICIAL'
)
ON CONFLICT (lid, company_id) DO UPDATE SET
  phone = EXCLUDED.phone,
  contact_id = EXCLUDED.contact_id,
  instance_name = EXCLUDED.instance_name,
  updated_at = NOW();

-- 5. Atualizar metadata da conversa do Yago com o lidJid para evitar novas duplicatas
UPDATE conversations
SET metadata = jsonb_set(
  COALESCE(metadata, '{}'::jsonb),
  '{lidJid}',
  '"178576603263132@lid"'
)
WHERE id = '61f82363-6d0b-496e-ba6d-8dc39b60a570';
