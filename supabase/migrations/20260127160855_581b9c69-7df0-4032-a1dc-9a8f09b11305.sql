-- Corrigir nomes dos contatos "Via Infra" restantes

-- 1. SM Click (conta empresarial sem nome mas com descrição)
UPDATE contacts 
SET name = 'SM Click', updated_at = now()
WHERE id = '19b04050-5f1c-4576-a2a1-e07a4d8477c3';

-- 2. Contato sem nome no perfil - usar telefone formatado
UPDATE contacts 
SET name = '(11) 94851-5219', updated_at = now()
WHERE id = '90099585-dbc4-4457-985a-83bcb50c197b';

-- 3. Listas de transmissão (@broadcast)
UPDATE contacts 
SET name = 'Lista de Transmissão', updated_at = now()
WHERE id IN ('e09b6559-d954-40cc-b9b0-ecaf2b4b582c', '7d5c1d8e-c86f-4ebc-aa69-c6bb03fdb126');

-- 4. Contatos temporários (cmj.../cmk...) - renomear para identificar
UPDATE contacts 
SET name = 'Contato Temporário', updated_at = now()
WHERE id IN (
  '1f3b1c9f-0032-44fc-a90e-99edbbd57453',
  '625fd8b4-ccdf-4d74-aaae-39b19e92c409',
  '8def036a-0aa7-4ee1-bb4a-3df7354442e0',
  '07f495f3-0a79-4bfe-806e-4450188c5992',
  '13b9ccf2-7a99-4f72-8d5e-df70eab19f74',
  '035f936d-45a9-4e47-8b33-a3c90fd19047'
);