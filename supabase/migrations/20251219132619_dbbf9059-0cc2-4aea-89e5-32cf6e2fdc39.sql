
-- Atualizar updated_at de CADA conversa individualmente
UPDATE conversations SET updated_at = '2025-12-19 12:42:19+00' WHERE id = 'b5ae0c99-91fb-420b-a687-590dac429766'; -- Giovanna
UPDATE conversations SET updated_at = '2025-12-19 12:39:27+00' WHERE id = '156f6af1-5502-4a84-9b5e-4b1b0a82bdf7'; -- E A Claro
UPDATE conversations SET updated_at = '2025-12-19 12:34:03.477988+00' WHERE id = '18f47bb1-db28-488c-bcbd-a1b50ebd2740'; -- Via & T.Informatica
UPDATE conversations SET updated_at = '2025-12-19 13:18:16+00' WHERE id = 'f1cf799f-9fbd-41b8-be35-db92eebe1aac'; -- Juscilana
UPDATE conversations SET updated_at = '2025-12-19 12:25:39+00' WHERE id = 'b2c3d4e5-f6a7-8901-bcde-f12345678901'; -- Joao de Lima Junior
UPDATE conversations SET updated_at = '2025-12-19 12:07:18.265+00' WHERE id = '43e8f4af-3486-419c-8c97-ae066c0e4c23'; -- Jaquisson
UPDATE conversations SET updated_at = '2025-12-19 12:03:13.202+00' WHERE id = 'a287b9b7-6b55-413d-87e5-92612110b198'; -- Francisco Funcionário
UPDATE conversations SET updated_at = '2025-12-19 10:24:39.945+00' WHERE id = '5c15432d-f614-4e1e-b229-7ccc7d61f835'; -- Fabrício

-- Também atualizar outras conversas importantes
UPDATE conversations c
SET updated_at = (
  SELECT MAX(m.created_at) 
  FROM messages m 
  WHERE m.conversation_id = c.id
)
WHERE c.channel = 'whatsapp'
AND c.id NOT IN (
  'b5ae0c99-91fb-420b-a687-590dac429766',
  '156f6af1-5502-4a84-9b5e-4b1b0a82bdf7',
  '18f47bb1-db28-488c-bcbd-a1b50ebd2740',
  'f1cf799f-9fbd-41b8-be35-db92eebe1aac',
  'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  '43e8f4af-3486-419c-8c97-ae066c0e4c23',
  'a287b9b7-6b55-413d-87e5-92612110b198',
  '5c15432d-f614-4e1e-b229-7ccc7d61f835'
)
AND EXISTS (SELECT 1 FROM messages m WHERE m.conversation_id = c.id);
