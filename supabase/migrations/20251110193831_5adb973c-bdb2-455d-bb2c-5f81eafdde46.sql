-- Atualizar o telefone da Elisabete com o número correto
UPDATE contacts 
SET phone = '5511999188607',
    updated_at = now()
WHERE name = 'Elisabete' 
  AND phone IS NULL
  AND company_id = 'da17735c-5a76-4797-b338-f6e63a7b3f8b';