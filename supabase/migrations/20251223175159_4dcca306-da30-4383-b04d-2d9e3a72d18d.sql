
-- Corrigir conversa Luis Pirata que tem lidJid mas não remoteJid
UPDATE conversations 
SET metadata = jsonb_set(
  metadata,
  '{remoteJid}',
  '"31864395927747@lid"'
)
WHERE id = 'add12ae7-1639-43f7-95b1-e060efcaab9f';

-- Corrigir também o contato (phone está com ID incorreto)
UPDATE contacts 
SET 
  phone = NULL,
  metadata = jsonb_set(
    COALESCE(metadata, '{}'::jsonb),
    '{remoteJid}',
    '"31864395927747@lid"'
  )
WHERE name = 'Luis Pirata' 
AND company_id = 'da17735c-5a76-4797-b338-f6e63a7b3f8b';
