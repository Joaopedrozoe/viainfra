
-- DESABILITAR TRIGGER TEMPORARIAMENTE
ALTER TABLE conversations DISABLE TRIGGER update_conversations_updated_at;

-- Yago M Sam deve aparecer na posição 2 (17:12 BRT = 20:12 UTC)
-- E A Claro já está correto no topo (20:16 UTC)
UPDATE conversations SET updated_at = '2025-12-18 20:12:00+00'::timestamptz
WHERE id = '61f82363-6d0b-496e-ba6d-8dc39b60a570';

-- Luis Pirata não tem mensagens, mover para baixo
UPDATE conversations SET updated_at = '2025-12-18 17:00:00+00'::timestamptz
WHERE id = 'add12ae7-1639-43f7-95b1-e060efcaab9f';

-- Gerente Claro não aparece na posição atual da imagem do WhatsApp, mover para baixo
UPDATE conversations SET updated_at = '2025-12-18 17:00:00+00'::timestamptz
WHERE id = '10076e35-5184-4008-82e3-d2dd0d30a2f7';

-- REABILITAR TRIGGER
ALTER TABLE conversations ENABLE TRIGGER update_conversations_updated_at;
