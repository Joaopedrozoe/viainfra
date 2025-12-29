
-- ============================================================
-- CORREÇÃO: Mesclar conversa @lid com conversa real do Financeiro UP
-- LID: 52381555417133@lid -> Telefone: 5511934558546
-- ============================================================

-- 1. Criar mapeamento LID → telefone real
INSERT INTO lid_phone_mapping (lid, phone, contact_id, company_id, instance_name)
SELECT 
  '52381555417133' as lid,
  '5511934558546' as phone,
  '3f4656c7-7930-49d6-8fc0-2853e0899954' as contact_id, -- Financeiro Up Cristiane
  (SELECT company_id FROM contacts WHERE id = '3f4656c7-7930-49d6-8fc0-2853e0899954') as company_id,
  'VIAINFRAOFICIAL' as instance_name
WHERE NOT EXISTS (
  SELECT 1 FROM lid_phone_mapping WHERE lid = '52381555417133'
);

-- 2. Migrar mensagens da conversa @lid para a conversa correta
UPDATE messages 
SET conversation_id = '6e0fafce-7bd5-4a7b-8a93-fbd23f5f9011' -- Conversa correta Financeiro Up
WHERE conversation_id = 'a66c91cd-83f9-45db-be40-3047e435040e' -- Conversa @lid errada
AND metadata->>'external_id' NOT IN (
  -- Evitar duplicatas por external_id
  SELECT COALESCE(m2.metadata->>'external_id', '') 
  FROM messages m2
  WHERE m2.conversation_id = '6e0fafce-7bd5-4a7b-8a93-fbd23f5f9011'
  AND m2.metadata->>'external_id' IS NOT NULL
);

-- 3. Atualizar metadata da conversa correta com lidJid
UPDATE conversations 
SET metadata = jsonb_set(
  COALESCE(metadata, '{}'), 
  '{lidJid}', 
  '"52381555417133@lid"'
)
WHERE id = '6e0fafce-7bd5-4a7b-8a93-fbd23f5f9011';

-- 4. Atualizar updated_at da conversa correta
UPDATE conversations 
SET updated_at = (
  SELECT MAX(created_at) 
  FROM messages 
  WHERE conversation_id = '6e0fafce-7bd5-4a7b-8a93-fbd23f5f9011'
)
WHERE id = '6e0fafce-7bd5-4a7b-8a93-fbd23f5f9011';

-- 5. Arquivar a conversa @lid (agora vazia)
UPDATE conversations 
SET 
  status = 'resolved',
  archived = true,
  updated_at = now()
WHERE id = 'a66c91cd-83f9-45db-be40-3047e435040e';

-- 6. Também arquivar o contato "Via Infra" que é genérico
UPDATE contacts 
SET 
  metadata = jsonb_set(
    COALESCE(metadata, '{}'),
    '{archived}',
    'true'
  ),
  name = 'Via Infra (Arquivado - LID 52381555417133)'
WHERE id = '031c8dfb-8b3b-414e-b8b3-087828805c9d';
