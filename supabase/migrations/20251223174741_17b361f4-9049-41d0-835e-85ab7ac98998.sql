
-- Marcar conversas de grupos como isGroup e garantir remoteJid correto
-- Grupos já têm remoteJid correto (@g.us), só precisam do flag isGroup

UPDATE conversations 
SET metadata = jsonb_set(
  COALESCE(metadata, '{}'::jsonb),
  '{isGroup}',
  'true'
)
WHERE metadata->>'remoteJid' LIKE '%@g.us%'
AND company_id = 'da17735c-5a76-4797-b338-f6e63a7b3f8b';

-- Marcar broadcasts
UPDATE conversations 
SET metadata = jsonb_set(
  COALESCE(metadata, '{}'::jsonb),
  '{isBroadcast}',
  'true'
)
WHERE metadata->>'remoteJid' LIKE '%@broadcast%'
AND company_id = 'da17735c-5a76-4797-b338-f6e63a7b3f8b';

-- Atualizar conversas LID com flag para identificação
UPDATE conversations 
SET metadata = jsonb_set(
  COALESCE(metadata, '{}'::jsonb),
  '{isLidContact}',
  'true'
)
WHERE metadata->>'remoteJid' LIKE '%@lid%'
AND company_id = 'da17735c-5a76-4797-b338-f6e63a7b3f8b';
