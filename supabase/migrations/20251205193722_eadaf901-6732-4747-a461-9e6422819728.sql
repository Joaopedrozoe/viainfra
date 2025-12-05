-- Fix conversation without instanceName
UPDATE conversations 
SET metadata = jsonb_set(COALESCE(metadata::jsonb, '{}'::jsonb), '{instanceName}', '"TESTE2"')
WHERE id = '31cbab2d-ecd8-4389-8754-a5e711d4260d';