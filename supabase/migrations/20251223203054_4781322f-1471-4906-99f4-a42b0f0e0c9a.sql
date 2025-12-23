
-- ============================================================
-- CORREÇÃO: Conversas sem remoteJid no metadata
-- ============================================================

-- 1. Atualizar conversa da Flavia Financeiro com remoteJid correto
UPDATE conversations 
SET metadata = jsonb_build_object(
  'remoteJid', '5511971947986@s.whatsapp.net',
  'instanceName', 'VIAINFRAOFICIAL',
  'fixedAt', now()::text
)
WHERE id = '7d994378-6a3e-46a5-b188-c349beab6e71';

-- 2. Atualizar conversa do Yago Msam com remoteJid (se não tiver instanceName)
UPDATE conversations 
SET metadata = metadata || jsonb_build_object(
  'remoteJid', '551120854990@s.whatsapp.net',
  'instanceName', 'VIAINFRAOFICIAL'
)
WHERE id = 'fd52c009-c3f6-4933-8e06-92bc10dc0e32'
AND NOT (metadata ? 'instanceName' AND metadata ? 'remoteJid');

-- 3. Corrigir TODAS as conversas WhatsApp que não têm remoteJid mas o contato tem
UPDATE conversations c
SET metadata = c.metadata || jsonb_build_object(
  'remoteJid', ct.metadata->>'remoteJid',
  'fixedFromContact', true
)
FROM contacts ct
WHERE c.contact_id = ct.id
AND c.channel = 'whatsapp'
AND (NOT (c.metadata ? 'remoteJid') OR c.metadata->>'remoteJid' IS NULL)
AND ct.metadata ? 'remoteJid'
AND ct.metadata->>'remoteJid' IS NOT NULL;
