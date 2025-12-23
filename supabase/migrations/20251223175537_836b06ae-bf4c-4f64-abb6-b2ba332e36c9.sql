-- Corrigir telefone do Eliomar e reabrir conversa
UPDATE contacts 
SET 
  phone = '5511992511175',
  metadata = jsonb_set(
    COALESCE(metadata, '{}'::jsonb),
    '{phoneResolved}',
    'true'
  )
WHERE id = '0a8fd98a-e1ac-49b8-a7a9-57e6eae22df9';

-- Reabrir conversa
UPDATE conversations 
SET status = 'open'
WHERE id = 'fc3f1e58-1c5e-4c06-8a69-4f4d67122489';