
-- Mover "Gerente Claro - Julio Rodrigues" para baixo de Giovanna (15:50 SP = 18:50 UTC)
UPDATE messages SET created_at = '2025-12-18 18:50:00+00'::timestamptz WHERE id = '243c4721-b603-4c57-81ab-437c05493634';
UPDATE conversations SET updated_at = '2025-12-18 18:50:00+00'::timestamptz WHERE id = '10076e35-5184-4008-82e3-d2dd0d30a2f7';

-- Luis Pirata - mover para baixo (sem mensagens, apenas updated_at)
UPDATE conversations SET updated_at = '2025-12-18 18:40:00+00'::timestamptz WHERE id = 'add12ae7-1639-43f7-95b1-e060efcaab9f';

-- Atendimento Viainfra - mover para baixo de Giovanna
UPDATE conversations SET updated_at = '2025-12-18 18:45:00+00'::timestamptz WHERE id = 'ca50d581-332b-4263-be99-5570facec45e';

-- Verificar mensagem mais recente de Atendimento Viainfra e mover
UPDATE messages SET created_at = '2025-12-18 18:45:00+00'::timestamptz 
WHERE conversation_id = 'ca50d581-332b-4263-be99-5570facec45e'
AND created_at = (
  SELECT MAX(created_at) FROM messages WHERE conversation_id = 'ca50d581-332b-4263-be99-5570facec45e'
);
