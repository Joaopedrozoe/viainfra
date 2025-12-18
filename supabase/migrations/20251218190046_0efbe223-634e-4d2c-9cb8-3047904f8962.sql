
-- Criar conversa para VIAINFRA-RH
INSERT INTO conversations (
  contact_id,
  company_id,
  channel,
  status,
  bot_active,
  metadata,
  created_at,
  updated_at
)
VALUES (
  '6afbbfae-cd52-4bff-aa6a-0ba2ecb1d98b',
  'da17735c-5a76-4797-b338-f6e63a7b3f8b',
  'whatsapp',
  'open',
  false,
  '{"remoteJid": "120363420047176746@g.us", "instanceName": "VIAINFRAOFICIAL", "isGroup": true}'::jsonb,
  now(),
  now()
)
ON CONFLICT DO NOTHING;
