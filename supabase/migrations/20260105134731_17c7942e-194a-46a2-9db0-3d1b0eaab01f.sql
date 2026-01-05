
-- 1. Criar LID mapping para André Frota
INSERT INTO lid_phone_mapping (lid, phone, contact_id, company_id, instance_name)
VALUES (
  '238650377904231@lid',
  '5511992542914',
  '76606212-5aed-474e-85d9-ed65514e11c9',
  'da17735c-5a76-4797-b338-f6e63a7b3f8b',
  'VIAINFRAOFICIAL'
)
ON CONFLICT DO NOTHING;

-- 2. Mover todas as mensagens das conversas LID para a conversa principal
UPDATE messages 
SET conversation_id = 'a0d59b2c-810e-4950-8456-868502d71d21'
WHERE conversation_id IN (
  '304b760b-ec5a-4029-b74e-9184d591f629',
  '072b7f03-7c99-407b-bed5-2e3d83b4072d'
);

-- 3. Arquivar as conversas LID duplicadas
UPDATE conversations 
SET archived = true, status = 'resolved'
WHERE id IN (
  '304b760b-ec5a-4029-b74e-9184d591f629',
  '072b7f03-7c99-407b-bed5-2e3d83b4072d'
);

-- 4. Atualizar metadata da conversa principal para incluir o LID
UPDATE conversations
SET metadata = jsonb_build_object(
  'remoteJid', '5511992542914@s.whatsapp.net',
  'instanceName', 'VIAINFRAOFICIAL',
  'lidJid', '238650377904231@lid'
),
updated_at = NOW()
WHERE id = 'a0d59b2c-810e-4950-8456-868502d71d21';
