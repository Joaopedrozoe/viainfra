
-- Atualizar metadata da conversa com remoteJid correto para envio
UPDATE conversations 
SET metadata = jsonb_set(
  COALESCE(metadata, '{}'::jsonb),
  '{remoteJid}',
  '"5511992511175@s.whatsapp.net"'
)
WHERE id = '26ec8c81-f389-4c73-90ae-b81f9f1f6626';
