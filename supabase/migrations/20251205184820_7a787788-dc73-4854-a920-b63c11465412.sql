-- Consolidar contatos duplicados da Giih
-- Manter o mais recente e deletar o antigo

-- Primeiro, atualizar conversas do contato antigo para o novo
UPDATE conversations 
SET contact_id = 'eee42dc1-b9dc-44ad-91cd-9d92e2ad2e03'
WHERE contact_id = '9d99c211-0951-4091-a33b-042477539e9c';

-- Atualizar typing_status
UPDATE typing_status 
SET contact_id = 'eee42dc1-b9dc-44ad-91cd-9d92e2ad2e03'
WHERE contact_id = '9d99c211-0951-4091-a33b-042477539e9c';

-- Deletar contato duplicado antigo
DELETE FROM contacts WHERE id = '9d99c211-0951-4091-a33b-042477539e9c';

-- Normalizar TODOS os telefones para ter prefixo 55
UPDATE contacts
SET phone = '55' || phone
WHERE phone IS NOT NULL 
AND phone ~ '^\d{10,11}$'
AND phone NOT LIKE '55%';