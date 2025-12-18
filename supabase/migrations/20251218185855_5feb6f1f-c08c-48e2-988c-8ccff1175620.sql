
-- Criar conversa para Diego Motorista
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
  'b29ba950-23f8-413c-91ba-3ce3015bb33f',
  'da17735c-5a76-4797-b338-f6e63a7b3f8b',
  'whatsapp',
  'open',
  true,
  '{"remoteJid": "5511965155545@s.whatsapp.net", "instanceName": "VIAINFRAOFICIAL"}'::jsonb,
  now(),
  now()
)
ON CONFLICT DO NOTHING
RETURNING id;
