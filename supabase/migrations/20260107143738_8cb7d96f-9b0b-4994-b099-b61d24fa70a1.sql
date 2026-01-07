
-- 1. Renomear contato Flavia Oliveira para Via Logistic
UPDATE contacts
SET 
  name = 'Via Logistic',
  metadata = COALESCE(metadata, '{}'::jsonb) || '{"previousName": "Flavia Oliveira", "lidJid": "133728789614670@lid", "mergedAt": "2026-01-07"}'::jsonb,
  updated_at = now()
WHERE id = '37c3e917-d9f3-416d-8a75-0fc2b52bec19';

-- 2. Mover mensagens da conversa Via Logistic (LID) para conversa correta
UPDATE messages
SET conversation_id = 'b64bfff8-7ac1-4845-a1ed-c230c9f23d9a'
WHERE conversation_id = '06b44d01-b64f-4531-88a7-c891c7a013d8';

-- 3. Atualizar metadata da conversa correta com info do LID
UPDATE conversations
SET 
  metadata = COALESCE(metadata, '{}'::jsonb) || '{"lidJid": "133728789614670@lid", "merged": true}'::jsonb,
  updated_at = now()
WHERE id = 'b64bfff8-7ac1-4845-a1ed-c230c9f23d9a';

-- 4. Criar mapeamento LID -> telefone
INSERT INTO lid_phone_mapping (lid, phone, contact_id, company_id, instance_name)
VALUES (
  '133728789614670',
  '5511918752320',
  '37c3e917-d9f3-416d-8a75-0fc2b52bec19',
  'da17735c-5a76-4797-b338-f6e63a7b3f8b',
  'VIAINFRAOFICIAL'
)
ON CONFLICT DO NOTHING;

-- 5. Deletar conversa órfã (Via Logistic sem telefone)
DELETE FROM conversations
WHERE id = '06b44d01-b64f-4531-88a7-c891c7a013d8';

-- 6. Deletar contato órfão (Via Logistic só LID)
DELETE FROM contacts
WHERE id = '69ed9827-4a4e-40d9-8fa7-047ac9e94411';
