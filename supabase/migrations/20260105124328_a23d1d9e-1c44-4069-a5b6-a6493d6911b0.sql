
-- Mesclar conversa "Tork Tacógrafos Guarulhos" (LID) com a conversa correta (+55 11 94004-1113)
-- Conversa correta: 37132179-79ae-452e-aa15-0c8201a392c5 (com phone)
-- Conversa duplicada: c6d5a1fd-e7dd-4e01-94ba-360874a80d1d (LID)

-- 1. Mover todas as mensagens da conversa duplicada para a conversa correta
UPDATE messages 
SET conversation_id = '37132179-79ae-452e-aa15-0c8201a392c5'
WHERE conversation_id = 'c6d5a1fd-e7dd-4e01-94ba-360874a80d1d';

-- 2. Criar mapeamento LID para telefone para evitar duplicações futuras
INSERT INTO lid_phone_mapping (lid, phone, contact_id, company_id, instance_name)
SELECT 
  '270132135866531@lid',
  '5511940041113',
  '5e430b7e-2b9e-43d8-9586-6fb81b89e577',
  company_id,
  'VIAINFRAOFICIAL'
FROM contacts WHERE id = '5e430b7e-2b9e-43d8-9586-6fb81b89e577'
AND NOT EXISTS (
  SELECT 1 FROM lid_phone_mapping WHERE lid = '270132135866531@lid'
);

-- 3. Atualizar o contato com o lidJid no metadata
UPDATE contacts 
SET metadata = jsonb_set(
  COALESCE(metadata, '{}'::jsonb),
  '{lidJid}',
  '"270132135866531@lid"'::jsonb
)
WHERE id = '5e430b7e-2b9e-43d8-9586-6fb81b89e577';

-- 4. Atualizar a conversa com o lidJid no metadata
UPDATE conversations 
SET 
  metadata = jsonb_set(
    COALESCE(metadata, '{}'::jsonb),
    '{lidJid}',
    '"270132135866531@lid"'::jsonb
  ),
  updated_at = now()
WHERE id = '37132179-79ae-452e-aa15-0c8201a392c5';

-- 5. Deletar a conversa duplicada
DELETE FROM conversations 
WHERE id = 'c6d5a1fd-e7dd-4e01-94ba-360874a80d1d';

-- 6. Deletar o contato duplicado (LID sem phone)
DELETE FROM contacts 
WHERE id = '156680cb-e39d-4d4d-992a-076457205cda';
