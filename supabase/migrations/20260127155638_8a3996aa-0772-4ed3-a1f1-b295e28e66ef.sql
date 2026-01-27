-- Corrigir nomes de grupos que estão com "Via Infra" (nome do participante)
-- usando o nome correto de grupos duplicados que já existem

WITH correct_names AS (
  SELECT 
    metadata->>'remoteJid' as jid,
    name
  FROM contacts
  WHERE metadata->>'isGroup' = 'true'
    AND company_id = 'da17735c-5a76-4797-b338-f6e63a7b3f8b'
    AND name != 'Via Infra'
    AND name IS NOT NULL
    AND name != ''
)
UPDATE contacts c
SET name = cn.name, updated_at = now()
FROM correct_names cn
WHERE c.metadata->>'remoteJid' = cn.jid
  AND c.name = 'Via Infra'
  AND c.company_id = 'da17735c-5a76-4797-b338-f6e63a7b3f8b'
  AND c.metadata->>'isGroup' = 'true';