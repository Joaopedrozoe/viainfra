-- LIMPEZA URGENTE: Remover TODOS os dados lixo cmj%

-- 1. Deletar mensagens das conversas com remoteJid cmj%
DELETE FROM messages 
WHERE conversation_id IN (
  SELECT id FROM conversations 
  WHERE metadata->>'remoteJid' LIKE 'cmj%'
);

-- 2. Deletar mensagens de conversas com contatos cmj%
DELETE FROM messages 
WHERE conversation_id IN (
  SELECT conv.id FROM conversations conv
  JOIN contacts c ON conv.contact_id = c.id
  WHERE c.phone LIKE 'cmj%' OR c.name LIKE 'cmj%'
);

-- 3. Deletar conversas com remoteJid cmj%
DELETE FROM conversations 
WHERE metadata->>'remoteJid' LIKE 'cmj%';

-- 4. Deletar conversas com contatos cmj%
DELETE FROM conversations 
WHERE contact_id IN (
  SELECT id FROM contacts WHERE phone LIKE 'cmj%' OR name LIKE 'cmj%'
);

-- 5. Deletar contatos com phone cmj%
DELETE FROM contacts WHERE phone LIKE 'cmj%';

-- 6. Deletar contatos com name cmj%
DELETE FROM contacts WHERE name LIKE 'cmj%';