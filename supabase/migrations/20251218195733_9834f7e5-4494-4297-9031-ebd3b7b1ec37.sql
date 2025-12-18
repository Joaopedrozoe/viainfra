
-- Recriar João de Lima Junior (contato @lid)
INSERT INTO contacts (id, company_id, name, phone, metadata, created_at, updated_at)
VALUES ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'da17735c-5a76-4797-b338-f6e63a7b3f8b', 'Joao de Lima Junior', NULL, '{"remoteJid": "cmjbra3gy4b7eo64igjfim8dy@lid", "lidJid": "cmjbra3gy4b7eo64igjfim8dy@lid", "preserved": true}'::jsonb, now(), now())
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, metadata = EXCLUDED.metadata, updated_at = now();

-- Criar conversa do João
INSERT INTO conversations (id, company_id, contact_id, channel, status, metadata, created_at, updated_at)
VALUES ('b2c3d4e5-f6a7-8901-bcde-f12345678901', 'da17735c-5a76-4797-b338-f6e63a7b3f8b', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'whatsapp', 'open', '{"instanceName": "VIAINFRAOFICIAL", "remoteJid": "cmjbra3gy4b7eo64igjfim8dy@lid", "preserved": true}'::jsonb, now(), '2025-12-18 19:27:00+00')
ON CONFLICT (id) DO UPDATE SET metadata = EXCLUDED.metadata, updated_at = EXCLUDED.updated_at;

-- Mensagem do João (16:27 SP)
INSERT INTO messages (id, conversation_id, sender_type, content, metadata, created_at)
VALUES ('c3d4e5f6-a7b8-9012-cdef-123456789012', 'b2c3d4e5-f6a7-8901-bcde-f12345678901', 'agent', 'Obrigada! Desejo uma ótima tarde', '{"preserved": true}'::jsonb, '2025-12-18 19:27:00+00')
ON CONFLICT (id) DO UPDATE SET content = EXCLUDED.content, created_at = EXCLUDED.created_at;

-- Atualizar Flavio Gonçalves para "Nova conversa"
UPDATE messages SET content = 'Nova conversa' WHERE conversation_id = '7d35a181-f1ef-4c50-9ce1-18e1c37170da' AND content LIKE '%Foto%';
UPDATE conversations SET updated_at = '2025-12-18 19:13:00+00' WHERE id = '7d35a181-f1ef-4c50-9ce1-18e1c37170da';
