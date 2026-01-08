
-- Remover contatos individuais sem telefone e sem email (não grupos)
-- Primeiro, remover conversas órfãs associadas a esses contatos sem mensagens
DELETE FROM conversations 
WHERE contact_id IN (
  SELECT c.id FROM contacts c
  WHERE 
    (c.phone IS NULL OR c.phone = '')
    AND (c.email IS NULL OR c.email = '')
    AND (c.metadata->>'remoteJid' NOT LIKE '%@g.us%' OR c.metadata->>'remoteJid' IS NULL)
)
AND id NOT IN (SELECT DISTINCT conversation_id FROM messages WHERE conversation_id IS NOT NULL);

-- Agora remover os contatos sem telefone/email que não são grupos
DELETE FROM contacts
WHERE 
  (phone IS NULL OR phone = '')
  AND (email IS NULL OR email = '')
  AND (metadata->>'remoteJid' NOT LIKE '%@g.us%' OR metadata->>'remoteJid' IS NULL)
  AND id NOT IN (
    SELECT DISTINCT contact_id FROM conversations WHERE contact_id IS NOT NULL
  );

-- Para contatos com conversas que têm mensagens, apenas marcar como arquivado
-- (não podemos deletar pois perderíamos histórico)
UPDATE conversations
SET archived = true
WHERE contact_id IN (
  SELECT c.id FROM contacts c
  WHERE 
    (c.phone IS NULL OR c.phone = '')
    AND (c.email IS NULL OR c.email = '')
    AND (c.metadata->>'remoteJid' NOT LIKE '%@g.us%' OR c.metadata->>'remoteJid' IS NULL)
);
