-- Atualizar contatos de grupo sem company_id
UPDATE contacts
SET company_id = 'da17735c-5a76-4797-b338-f6e63a7b3f8b',
    updated_at = now()
WHERE company_id IS NULL
  AND metadata->>'isGroup' = 'true';

-- Atualizar conversas de grupo sem company_id  
UPDATE conversations
SET company_id = 'da17735c-5a76-4797-b338-f6e63a7b3f8b',
    updated_at = now()
WHERE company_id IS NULL
  AND metadata->>'isGroup' = 'true';