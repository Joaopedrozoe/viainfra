-- Corrigir nome do grupo que foi importado com nome errado
UPDATE contacts 
SET name = 'Grupo Elisabete'
WHERE id = '23094dc4-7433-4d00-bac1-88780deb8f09'
AND metadata->>'isGroup' = 'true';

-- Verificar outros grupos que podem ter nomes incorretos e marcar claramente
UPDATE contacts
SET name = CASE 
  WHEN name ~ '^\d+$' THEN 'Grupo ' || SUBSTRING(metadata->>'remoteJid' FROM 1 FOR 8)
  ELSE name
END
WHERE company_id = 'da17735c-5a76-4797-b338-f6e63a7b3f8b'
AND metadata->>'isGroup' = 'true'
AND (name ~ '^\d+$' OR name IS NULL);