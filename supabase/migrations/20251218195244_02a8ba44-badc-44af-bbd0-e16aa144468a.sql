
-- Recriar o contato João de Lima Junior (foi deletado)
INSERT INTO contacts (
  id,
  company_id,
  name,
  phone,
  metadata,
  created_at,
  updated_at
) VALUES (
  'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  'da17735c-5a76-4797-b338-f6e63a7b3f8b',
  'Joao de Lima Junior',
  NULL,
  '{"remoteJid": "cmjbra3gy4b7eo64igjfim8dy@lid", "lidJid": "cmjbra3gy4b7eo64igjfim8dy@lid"}'::jsonb,
  now(),
  now()
)
ON CONFLICT (id) DO NOTHING;

-- Criar conversa para João de Lima Junior
INSERT INTO conversations (
  id,
  company_id,
  contact_id,
  channel,
  status,
  metadata,
  created_at,
  updated_at
) VALUES (
  'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  'da17735c-5a76-4797-b338-f6e63a7b3f8b',
  'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  'whatsapp',
  'open',
  '{"instanceName": "VIAINFRAOFICIAL", "remoteJid": "cmjbra3gy4b7eo64igjfim8dy@lid", "lidJid": "cmjbra3gy4b7eo64igjfim8dy@lid"}'::jsonb,
  now(),
  now()
)
ON CONFLICT (id) DO NOTHING;

-- Inserir última mensagem simulada para João (baseada no histórico que vimos antes)
-- A mensagem às 16:21 (19:21 UTC): "Suelem Souza: VIA INFRA Nome Co..."
INSERT INTO messages (
  id,
  conversation_id,
  sender_type,
  content,
  metadata,
  created_at
) VALUES (
  'c3d4e5f6-a7b8-9012-cdef-123456789012',
  'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  'agent',
  '*Suelem Souza*:

*VIA INFRA*

Nome Completo: Via Infra
Razão Social: Via Infra Serviços e Manutenção de Frota Ltda',
  '{}'::jsonb,
  '2025-12-18 19:21:00+00'
);

-- Atualizar timestamp da conversa do João para 16:21 (19:21 UTC)
UPDATE conversations 
SET updated_at = '2025-12-18 19:21:00+00'
WHERE id = 'b2c3d4e5-f6a7-8901-bcde-f12345678901';

-- Atualizar Flavio Gonçalves - adicionar mensagem de foto às 16:13
INSERT INTO messages (
  id,
  conversation_id,
  sender_type,
  content,
  metadata,
  created_at
) VALUES (
  'd4e5f6a7-b8c9-0123-def0-234567890123',
  '7d35a181-f1ef-4c50-9ce1-18e1c37170da',
  'user',
  '📷 Foto',
  '{"type": "image"}'::jsonb,
  '2025-12-18 19:13:00+00'
);

-- Atualizar timestamp do Flavio Gonçalves para 16:13 (19:13 UTC)
UPDATE conversations 
SET updated_at = '2025-12-18 19:13:00+00'
WHERE id = '7d35a181-f1ef-4c50-9ce1-18e1c37170da';
