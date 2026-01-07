
-- ============================================================
-- CORREÇÃO: Mesclar conversa duplicada T Informatica -> Anthony Informatica
-- ============================================================

-- 1. Criar mapeamento LID->telefone para prevenir futuras duplicatas
INSERT INTO lid_phone_mapping (lid, phone, contact_id, company_id, instance_name)
VALUES (
  '195812239929471',
  '5511950025503',
  '2a0d754b-996a-4981-bef9-e012a424de95',
  (SELECT company_id FROM contacts WHERE id = '2a0d754b-996a-4981-bef9-e012a424de95'),
  'VIAINFRAOFICIAL'
)
ON CONFLICT (lid, company_id) DO UPDATE SET
  phone = EXCLUDED.phone,
  contact_id = EXCLUDED.contact_id,
  updated_at = now();

-- 2. Mover mensagens da conversa duplicada para a correta
UPDATE messages 
SET conversation_id = '31cbab2d-ecd8-4389-8754-a5e711d4260d'
WHERE conversation_id = 'e50bf8c5-22ab-483d-bdb0-633eacd9a5b6';

-- 3. Atualizar metadata da conversa correta com o lidJid
UPDATE conversations
SET metadata = metadata || '{"lidJid": "195812239929471@lid"}'::jsonb,
    updated_at = now()
WHERE id = '31cbab2d-ecd8-4389-8754-a5e711d4260d';

-- 4. Deletar a conversa duplicada
DELETE FROM conversations 
WHERE id = 'e50bf8c5-22ab-483d-bdb0-633eacd9a5b6';

-- 5. Deletar o contato órfão (T Informatica sem telefone)
DELETE FROM contacts 
WHERE id = 'fbfe1688-1695-4ec5-9acb-02bedc2a5b21';
