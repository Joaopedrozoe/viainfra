
-- Renomear Giih para Giovanna (conforme metadata mostra "Giovanna Ferreira")
UPDATE contacts
SET name = 'Giovanna'
WHERE id = 'eee42dc1-b9dc-44ad-91cd-9d92e2ad2e03';

-- Atualizar qualquer outro contato com phone 5511918660567 para Giovanna também
UPDATE contacts
SET name = 'Giovanna'
WHERE phone = '5511918660567'
AND company_id = 'da17735c-5a76-4797-b338-f6e63a7b3f8b';
