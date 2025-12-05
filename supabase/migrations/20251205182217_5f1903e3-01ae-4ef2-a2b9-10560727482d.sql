
-- Limpar conversas com 0 mensagens e contacts com phones inválidos (IDs internos)
-- Primeiro, deletar conversas problemáticas
DELETE FROM conversations 
WHERE id IN (
  SELECT c.id 
  FROM conversations c 
  LEFT JOIN messages m ON m.conversation_id = c.id 
  WHERE c.channel = 'whatsapp'
  GROUP BY c.id 
  HAVING COUNT(m.id) = 0
);

-- Deletar contacts órfãos que vieram de IDs internos (não têm mais conversas)
DELETE FROM contacts 
WHERE id NOT IN (SELECT DISTINCT contact_id FROM conversations WHERE contact_id IS NOT NULL)
AND company_id IS NOT NULL
AND metadata->>'source' LIKE '%whatsapp_sync%'
AND phone NOT LIKE '55%';
