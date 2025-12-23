
-- Corrigir nome do contato Yago Msam (era "Tork Tacógrafos")
UPDATE contacts 
SET name = 'Yago Msam', updated_at = now()
WHERE id = '315cc5d7-a6ad-4a8e-8b3f-91d65e3b0721';

-- Corrigir nome do contato Flavia Financeiro (era "Jairo Encarregado Empresa")
UPDATE contacts 
SET name = 'Flavia Financeiro', updated_at = now()
WHERE id = 'dc555fea-79ca-4fb9-94c5-483e1b1e9ee3';

-- Atualizar timestamp da conversa de Yago para garantir que apareça no topo
UPDATE conversations 
SET updated_at = now()
WHERE id = 'fd52c009-c3f6-4933-8e06-92bc10dc0e32';

-- Criar conversa para Flavia Financeiro se não existir
INSERT INTO conversations (contact_id, channel, status, company_id, updated_at)
SELECT 
  'dc555fea-79ca-4fb9-94c5-483e1b1e9ee3',
  'whatsapp',
  'open',
  company_id,
  now()
FROM contacts 
WHERE id = 'dc555fea-79ca-4fb9-94c5-483e1b1e9ee3'
AND NOT EXISTS (
  SELECT 1 FROM conversations WHERE contact_id = 'dc555fea-79ca-4fb9-94c5-483e1b1e9ee3'
);
