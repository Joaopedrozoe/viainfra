
-- Desabilitar trigger temporariamente
ALTER TABLE conversations DISABLE TRIGGER update_conversations_updated_at;

-- Corrigir ordem: Francisco (12:55) > Yago (11:46) > Flavio (11:38)

-- Francisco às 12:55 (15:55 UTC)
UPDATE conversations 
SET updated_at = '2025-12-23 15:55:00+00'
WHERE id = 'a287b9b7-6b55-413d-87e5-92612110b198';

-- Yago às 11:46 (14:46 UTC)
UPDATE conversations 
SET updated_at = '2025-12-23 14:46:00+00'
WHERE id = '61f82363-6d0b-496e-ba6d-8dc39b60a570';

-- Flavio às 11:38 (14:38 UTC)
UPDATE conversations 
SET updated_at = '2025-12-23 14:38:00+00'
WHERE id = '7d35a181-f1ef-4c50-9ce1-18e1c37170da';

-- Reabilitar trigger
ALTER TABLE conversations ENABLE TRIGGER update_conversations_updated_at;
