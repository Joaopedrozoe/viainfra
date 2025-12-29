
-- Inserir mensagens faltantes do Yago (14:17)
INSERT INTO messages (conversation_id, sender_type, content, created_at, metadata)
VALUES 
  ('fd52c009-c3f6-4933-8e06-92bc10dc0e32', 'agent', 'Emiti Via log, pois o Jairo falou .', '2025-12-29 17:16:22+00', '{"sender_name": "Via Infra", "manual_sync": true}'::jsonb),
  ('fd52c009-c3f6-4933-8e06-92bc10dc0e32', 'agent', 'Abençoado 🍀 desculpa', '2025-12-29 17:17:00+00', '{"sender_name": "Yago M Sam", "manual_sync": true}'::jsonb),
  ('fd52c009-c3f6-4933-8e06-92bc10dc0e32', 'user', 'Tá certo, obrigada', '2025-12-29 17:17:30+00', '{"sender_name": "Via Infra", "manual_sync": true}'::jsonb)
ON CONFLICT DO NOTHING;

-- Atualizar timestamp da conversa para que apareça no topo
UPDATE conversations 
SET updated_at = '2025-12-29 17:17:30+00'
WHERE id = 'fd52c009-c3f6-4933-8e06-92bc10dc0e32';
