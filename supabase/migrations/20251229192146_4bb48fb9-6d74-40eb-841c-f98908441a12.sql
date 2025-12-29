
-- ============================================================
-- CORREÇÃO: Mesclar conversas @lid com conversas reais
-- ============================================================

-- 1. Criar mapeamentos LID → telefone real
INSERT INTO lid_phone_mapping (lid, phone, contact_id, company_id, instance_name)
SELECT 
  '180938533241046' as lid,
  '5511960373848' as phone,
  '96580cac-bf3c-4b9d-b447-26d46a6c5693' as contact_id, -- Junior UP Rastreadores
  (SELECT company_id FROM contacts WHERE id = '96580cac-bf3c-4b9d-b447-26d46a6c5693') as company_id,
  'VIAINFRAOFICIAL' as instance_name
WHERE NOT EXISTS (
  SELECT 1 FROM lid_phone_mapping WHERE lid = '180938533241046'
);

INSERT INTO lid_phone_mapping (lid, phone, contact_id, company_id, instance_name)
SELECT 
  '103109397348555' as lid,
  '5511962220207' as phone,
  '725379bd-d75d-4995-8685-a628b637dbfb' as contact_id, -- Rogério Manoel Motorista
  (SELECT company_id FROM contacts WHERE id = '725379bd-d75d-4995-8685-a628b637dbfb') as company_id,
  'VIAINFRAOFICIAL' as instance_name
WHERE NOT EXISTS (
  SELECT 1 FROM lid_phone_mapping WHERE lid = '103109397348555'
);

-- 2. Migrar mensagens da conversa @lid do Junior UP para a conversa correta
UPDATE messages 
SET conversation_id = '28e90064-4911-4a79-b189-be62a7026d9a' -- Conversa correta Junior UP
WHERE conversation_id = '0d9e2d5b-e49b-4a9e-978c-3f8bb7ebebf4' -- Conversa @lid errada
AND id NOT IN (
  -- Evitar duplicatas: verificar external_id
  SELECT m2.id 
  FROM messages m2
  WHERE m2.conversation_id = '28e90064-4911-4a79-b189-be62a7026d9a'
);

-- 3. Migrar mensagens da conversa @lid do Rogério para a conversa correta
UPDATE messages 
SET conversation_id = '989df9f7-d7c7-435e-ad35-bd6e0ee5c68f' -- Conversa correta Rogério
WHERE conversation_id = '09ad4e41-1421-4312-8a18-4011b47f16cd' -- Conversa @lid errada
AND id NOT IN (
  SELECT m2.id 
  FROM messages m2
  WHERE m2.conversation_id = '989df9f7-d7c7-435e-ad35-bd6e0ee5c68f'
);

-- 4. Atualizar updated_at das conversas corretas com base na última mensagem
UPDATE conversations 
SET updated_at = (
  SELECT MAX(created_at) 
  FROM messages 
  WHERE conversation_id = '28e90064-4911-4a79-b189-be62a7026d9a'
)
WHERE id = '28e90064-4911-4a79-b189-be62a7026d9a';

UPDATE conversations 
SET updated_at = (
  SELECT MAX(created_at) 
  FROM messages 
  WHERE conversation_id = '989df9f7-d7c7-435e-ad35-bd6e0ee5c68f'
)
WHERE id = '989df9f7-d7c7-435e-ad35-bd6e0ee5c68f';

-- 5. Atualizar metadata das conversas para incluir lidJid
UPDATE conversations 
SET metadata = jsonb_set(
  COALESCE(metadata, '{}'), 
  '{lidJid}', 
  '"180938533241046@lid"'
)
WHERE id = '28e90064-4911-4a79-b189-be62a7026d9a';

UPDATE conversations 
SET metadata = jsonb_set(
  COALESCE(metadata, '{}'), 
  '{lidJid}', 
  '"103109397348555@lid"'
)
WHERE id = '989df9f7-d7c7-435e-ad35-bd6e0ee5c68f';

-- 6. Arquivar as conversas @lid vazias (agora sem mensagens)
UPDATE conversations 
SET 
  status = 'resolved',
  archived = true,
  updated_at = now()
WHERE id IN (
  '0d9e2d5b-e49b-4a9e-978c-3f8bb7ebebf4',
  '09ad4e41-1421-4312-8a18-4011b47f16cd'
);
