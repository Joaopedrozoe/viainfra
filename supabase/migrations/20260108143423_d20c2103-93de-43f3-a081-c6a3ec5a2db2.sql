
-- ============================================================
-- CORREÇÃO DE DADOS: André Finotti - Estratégia Alternativa
-- Manter a conversa NOVA (que tem o telefone correto) e mesclar a antiga
-- ============================================================

-- 1. Primeiro, mover todas as mensagens da conversa LID antiga para a conversa nova
UPDATE public.messages
SET conversation_id = '1ff36194-ce92-464f-8fa8-abffd3d2f99f'
WHERE conversation_id = '89ed8364-b604-4c00-ac29-a58adbe93fc9';

-- 2. Deletar a conversa LID antiga (André Finotti sem telefone)
DELETE FROM public.conversations
WHERE id = '89ed8364-b604-4c00-ac29-a58adbe93fc9';

-- 3. Deletar o contato LID antigo (André Finotti sem telefone)
DELETE FROM public.contacts
WHERE id = '7f325ec3-b350-43a0-bc31-50093a034c4a';

-- 4. Renomear o contato "Via Infra" para "André Finotti" e adicionar metadados LID
UPDATE public.contacts
SET 
  name = 'André Finotti',
  metadata = COALESCE(metadata, '{}'::jsonb) || '{"lidId": "46884030799921", "lidJid": "46884030799921@lid"}'::jsonb,
  updated_at = now()
WHERE id = '8df250a2-1398-45d9-a056-174a2d0cd450';

-- 5. Atualizar a conversa para ter os metadados corretos
UPDATE public.conversations
SET 
  metadata = COALESCE(metadata, '{}'::jsonb) || '{"lidJid": "46884030799921@lid", "lidId": "46884030799921"}'::jsonb,
  updated_at = now()
WHERE id = '1ff36194-ce92-464f-8fa8-abffd3d2f99f';

-- 6. Criar mapeamento LID -> telefone para futuras mensagens
INSERT INTO public.lid_phone_mapping (lid, phone, contact_id, company_id, instance_name)
SELECT 
  '46884030799921',
  '5511984874672',
  '8df250a2-1398-45d9-a056-174a2d0cd450',
  company_id,
  'VIAINFRAOFICIAL'
FROM contacts
WHERE id = '8df250a2-1398-45d9-a056-174a2d0cd450'
ON CONFLICT (lid, company_id) 
DO UPDATE SET 
  phone = EXCLUDED.phone,
  contact_id = EXCLUDED.contact_id,
  updated_at = now();
