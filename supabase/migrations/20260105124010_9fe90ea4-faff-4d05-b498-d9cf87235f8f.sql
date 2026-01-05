
-- Mesclar conversa "Adao" (LID) com "Adão Colaborador" (+55 11 99148-0719)
-- Conversa correta: 5d80fd12-1c42-4871-82af-15064f27f486 (Adão Colaborador)
-- Conversa duplicada: cbaa6ef6-daa5-47be-ae99-d023a713547a (Adao - LID)

-- 1. Mover todas as mensagens da conversa duplicada para a conversa correta
UPDATE messages 
SET conversation_id = '5d80fd12-1c42-4871-82af-15064f27f486'
WHERE conversation_id = 'cbaa6ef6-daa5-47be-ae99-d023a713547a';

-- 2. Criar mapeamento LID para telefone do Adão para evitar duplicações futuras
INSERT INTO lid_phone_mapping (lid, phone, contact_id, company_id, instance_name)
SELECT 
  '200579720728694@lid',
  '5511991480719',
  'b6ca0236-4533-4722-8473-693641e96db6',
  company_id,
  'VIAINFRAOFICIAL'
FROM contacts WHERE id = 'b6ca0236-4533-4722-8473-693641e96db6'
AND NOT EXISTS (
  SELECT 1 FROM lid_phone_mapping WHERE lid = '200579720728694@lid'
);

-- 3. Atualizar o contato do Adão com o lidJid correto no metadata
UPDATE contacts 
SET metadata = jsonb_set(
  COALESCE(metadata, '{}'::jsonb),
  '{lidJid}',
  '"200579720728694@lid"'::jsonb
)
WHERE id = 'b6ca0236-4533-4722-8473-693641e96db6';

-- 4. Atualizar a conversa do Adão com o lidJid no metadata
UPDATE conversations 
SET 
  metadata = jsonb_set(
    COALESCE(metadata, '{}'::jsonb),
    '{lidJid}',
    '"200579720728694@lid"'::jsonb
  ),
  updated_at = now()
WHERE id = '5d80fd12-1c42-4871-82af-15064f27f486';

-- 5. Deletar a conversa duplicada (sem mensagens agora)
DELETE FROM conversations 
WHERE id = 'cbaa6ef6-daa5-47be-ae99-d023a713547a';

-- 6. Deletar o contato duplicado (Adao - LID sem phone)
DELETE FROM contacts 
WHERE id = '904804bd-457b-473a-9f7e-04f1242c2bd3';
