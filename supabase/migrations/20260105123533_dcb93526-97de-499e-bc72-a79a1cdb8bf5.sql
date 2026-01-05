
-- Mesclar conversa "Up Rastreadores Equipamentos" (LID) com "Karlla Rastreador UP"
-- Conversa correta: 12c24bf8-4ded-4ae7-bdc9-64d2255d33c3 (Karlla)
-- Conversa duplicada: 998a23a9-c904-4ee6-9381-cbf7ee751c4b (Up Rastreadores)

-- 1. Mover todas as mensagens da conversa duplicada para a conversa correta
UPDATE messages 
SET conversation_id = '12c24bf8-4ded-4ae7-bdc9-64d2255d33c3'
WHERE conversation_id = '998a23a9-c904-4ee6-9381-cbf7ee751c4b';

-- 2. Criar mapeamento LID para telefone da Karlla para evitar duplicações futuras
INSERT INTO lid_phone_mapping (lid, phone, contact_id, company_id, instance_name)
SELECT 
  '216509469192281@lid',
  '5511943719968',
  '0e0aab26-86ee-484b-83e7-1cc8aff15100',
  company_id,
  'VIAINFRAOFICIAL'
FROM contacts WHERE id = '0e0aab26-86ee-484b-83e7-1cc8aff15100'
AND NOT EXISTS (
  SELECT 1 FROM lid_phone_mapping WHERE lid = '216509469192281@lid'
);

-- 3. Atualizar o contato da Karlla com o lidJid no metadata
UPDATE contacts 
SET metadata = jsonb_set(
  COALESCE(metadata, '{}'::jsonb),
  '{lidJid}',
  '"216509469192281@lid"'::jsonb
)
WHERE id = '0e0aab26-86ee-484b-83e7-1cc8aff15100';

-- 4. Atualizar a conversa da Karlla com o lidJid no metadata
UPDATE conversations 
SET 
  metadata = jsonb_set(
    COALESCE(metadata, '{}'::jsonb),
    '{lidJid}',
    '"216509469192281@lid"'::jsonb
  ),
  updated_at = now()
WHERE id = '12c24bf8-4ded-4ae7-bdc9-64d2255d33c3';

-- 5. Deletar a conversa duplicada (sem mensagens agora)
DELETE FROM conversations 
WHERE id = '998a23a9-c904-4ee6-9381-cbf7ee751c4b';

-- 6. Deletar o contato duplicado (Up Rastreadores Equipamentos - LID)
DELETE FROM contacts 
WHERE id = '2da5f921-62df-4588-b1f1-ee2e4ab21c36';
