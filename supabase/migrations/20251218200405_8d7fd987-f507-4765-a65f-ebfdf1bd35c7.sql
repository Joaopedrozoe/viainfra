
-- Corrigir timestamp da última mensagem de Via & T.Informatica para 16:56 SP (19:56 UTC)
UPDATE messages 
SET created_at = '2025-12-18 19:56:00+00'::timestamptz
WHERE id = 'a9967a65-6546-40b9-a146-1e2a216462a7';

-- Jairo - já está em 19:59, mas deveria ser 16:55 SP = 19:55 UTC  
UPDATE messages 
SET created_at = '2025-12-18 19:55:00+00'::timestamptz
WHERE id = 'b9610f87-8e4b-4014-96e6-919a2ef93c69';

-- Atualizar Via & T.Informatica updated_at
UPDATE conversations SET updated_at = '2025-12-18 19:56:00+00'::timestamptz WHERE id = '18f47bb1-db28-488c-bcbd-a1b50ebd2740';

-- Atualizar Jairo updated_at  
UPDATE conversations SET updated_at = '2025-12-18 19:55:00+00'::timestamptz WHERE id = '566d3343-8288-49cc-83e1-03b3c98f9932';
