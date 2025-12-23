-- ============================================================
-- CORREÇÃO: Caso Diego Motorista
-- Mover mensagem e criar mapeamento LID->telefone
-- ============================================================

-- 1. Mover a mensagem ✌️ para a conversa correta do Diego
UPDATE messages 
SET conversation_id = 'cdd9cfaf-ddb4-4780-af4a-65091ecc4ac0'
WHERE id = 'df507f27-bcd5-4d29-8b64-77dee8c24449';

-- 2. Atualizar o updated_at da conversa do Diego
UPDATE conversations 
SET updated_at = '2025-12-23 19:14:59+00'
WHERE id = 'cdd9cfaf-ddb4-4780-af4a-65091ecc4ac0';

-- 3. Adicionar o lidJid no metadata da conversa do Diego
UPDATE conversations 
SET metadata = metadata || '{"lidJid": "81961028706305@lid"}'::jsonb
WHERE id = 'cdd9cfaf-ddb4-4780-af4a-65091ecc4ac0';

-- 4. Criar mapeamento LID->telefone para evitar recorrência
INSERT INTO lid_phone_mapping (lid, phone, contact_id, company_id, instance_name)
SELECT 
  '81961028706305',
  '5511965155545',
  'b29ba950-23f8-413c-91ba-3ce3015bb33f',
  (SELECT company_id FROM conversations WHERE id = 'cdd9cfaf-ddb4-4780-af4a-65091ecc4ac0'),
  'VIAINFRAOFICIAL'
ON CONFLICT (lid, company_id) DO UPDATE SET
  phone = EXCLUDED.phone,
  contact_id = EXCLUDED.contact_id,
  updated_at = now();

-- 5. Deletar a conversa órfã (que agora está vazia)
DELETE FROM conversations WHERE id = '38c7000f-e579-4706-917e-8589a34d2660';

-- 6. Deletar o contato órfão que foi criado incorretamente
DELETE FROM contacts WHERE id = '9c781118-0d5a-41a5-80ab-6fe954a18c54';