
-- CORREÇÃO 1: Renomear contato emoji para "Joao de Lima Junior"
UPDATE contacts 
SET name = 'Joao de Lima Junior'
WHERE id = '86efccaf-0753-4b6e-b8ff-2cd4cb9d6e75';

-- CORREÇÃO 2: Arquivar conversa Luis Pirata (não existe no WhatsApp Web)
UPDATE conversations 
SET archived = true
WHERE id = 'add12ae7-1639-43f7-95b1-e060efcaab9f';

-- CORREÇÃO 3: Arquivar contato Luis Pirata também
UPDATE contacts 
SET metadata = jsonb_set(COALESCE(metadata, '{}'::jsonb), '{archived}', 'true')
WHERE id = '2c324ea1-bebf-488e-a0d5-9d46d7d67b97';

-- CORREÇÃO 4: Atualizar updated_at da conversa Joao de Lima Junior para refletir última mensagem (19:20:50)
UPDATE conversations 
SET updated_at = '2025-12-18 19:20:50+00'
WHERE id = '56e941a9-6101-41fe-87d2-b53a4601d26c';
