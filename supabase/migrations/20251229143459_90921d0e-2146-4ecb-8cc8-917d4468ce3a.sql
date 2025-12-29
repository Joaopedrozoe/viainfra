-- CORREÇÃO URGENTE: Remover dados inválidos criados pelo bug de sync
-- Contatos com formato cmja... são IDs de mensagem, não contatos reais

-- 1. Deletar mensagens das conversas inválidas
DELETE FROM messages 
WHERE conversation_id IN (
  SELECT conv.id FROM conversations conv
  JOIN contacts c ON conv.contact_id = c.id
  WHERE c.name LIKE 'cmja%' OR c.phone LIKE 'cmja%'
);

-- 2. Deletar conversas inválidas
DELETE FROM conversations 
WHERE contact_id IN (
  SELECT id FROM contacts WHERE name LIKE 'cmja%' OR phone LIKE 'cmja%'
);

-- 3. Deletar contatos inválidos
DELETE FROM contacts WHERE name LIKE 'cmja%' OR phone LIKE 'cmja%';