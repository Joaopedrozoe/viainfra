-- FASE 1: LIMPEZA E CORREÇÃO DE DADOS PARA INBOX 100% CONFIÁVEL

-- 1. Remover TODOS os contatos/conversas lixo que ainda existam (cmj%, wamid%, etc.)
-- Primeiro mensagens
DELETE FROM messages 
WHERE conversation_id IN (
  SELECT id FROM conversations 
  WHERE metadata->>'remoteJid' ~ '^(cmj|wamid|BAE|msg)[a-zA-Z0-9]+'
     OR metadata->>'remoteJid' NOT LIKE '%@%'
);

-- Depois conversas
DELETE FROM conversations 
WHERE metadata->>'remoteJid' ~ '^(cmj|wamid|BAE|msg)[a-zA-Z0-9]+'
   OR metadata->>'remoteJid' NOT LIKE '%@%';

-- Contatos com phone inválido
DELETE FROM contacts 
WHERE (phone ~ '^(cmj|wamid|BAE|msg)[a-zA-Z0-9]+')
   OR (name ~ '^(cmj|wamid|BAE|msg)[a-zA-Z0-9]+' AND phone IS NULL);

-- 2. Identificar e mesclar conversas @lid duplicadas
-- Mover mensagens de conversas @lid para conversas com telefone real
WITH lid_with_phone AS (
  SELECT 
    c1.id as lid_conv_id,
    c2.id as phone_conv_id,
    c1.contact_id as lid_contact_id,
    c2.contact_id as phone_contact_id
  FROM conversations c1
  JOIN conversations c2 ON c1.company_id = c2.company_id 
    AND c1.channel = 'whatsapp' 
    AND c2.channel = 'whatsapp'
  JOIN contacts ct1 ON c1.contact_id = ct1.id
  JOIN contacts ct2 ON c2.contact_id = ct2.id
  WHERE c1.metadata->>'remoteJid' LIKE '%@lid'
    AND c2.metadata->>'remoteJid' LIKE '%@s.whatsapp.net'
    AND LOWER(TRIM(ct1.name)) = LOWER(TRIM(ct2.name))
    AND c1.id != c2.id
)
-- Primeiro, atualizar mensagens para apontar para conversa com telefone
UPDATE messages m
SET conversation_id = lwp.phone_conv_id
FROM lid_with_phone lwp
WHERE m.conversation_id = lwp.lid_conv_id;

-- 3. Agora deletar as conversas @lid duplicadas (após mover mensagens)
DELETE FROM conversations 
WHERE id IN (
  SELECT c1.id
  FROM conversations c1
  JOIN conversations c2 ON c1.company_id = c2.company_id 
    AND c1.channel = 'whatsapp' 
    AND c2.channel = 'whatsapp'
  JOIN contacts ct1 ON c1.contact_id = ct1.id
  JOIN contacts ct2 ON c2.contact_id = ct2.id
  WHERE c1.metadata->>'remoteJid' LIKE '%@lid'
    AND c2.metadata->>'remoteJid' LIKE '%@s.whatsapp.net'
    AND LOWER(TRIM(ct1.name)) = LOWER(TRIM(ct2.name))
    AND c1.id != c2.id
);

-- 4. Deletar contatos órfãos @lid (sem conversa e sem telefone)
DELETE FROM contacts 
WHERE metadata->>'isLid' = 'true' 
  AND phone IS NULL
  AND id NOT IN (SELECT DISTINCT contact_id FROM conversations WHERE contact_id IS NOT NULL);

-- 5. Corrigir nomes genéricos de contatos (ex: "Contato 5511...")
UPDATE contacts 
SET name = phone
WHERE name LIKE 'Contato %' 
  AND phone IS NOT NULL 
  AND phone ~ '^\d{10,15}$';

-- 6. CRÍTICO: Recalcular updated_at de TODAS as conversas baseado na última mensagem real
UPDATE conversations c
SET updated_at = (
  SELECT MAX(m.created_at) 
  FROM messages m 
  WHERE m.conversation_id = c.id
)
WHERE EXISTS (
  SELECT 1 FROM messages m WHERE m.conversation_id = c.id
);

-- 7. Garantir que conversas sem mensagens tenham updated_at = created_at
UPDATE conversations 
SET updated_at = created_at
WHERE id NOT IN (SELECT DISTINCT conversation_id FROM messages WHERE conversation_id IS NOT NULL);

-- 8. Remover conversas vazias (sem mensagens e criadas há mais de 1 hora)
DELETE FROM conversations 
WHERE id NOT IN (SELECT DISTINCT conversation_id FROM messages WHERE conversation_id IS NOT NULL)
  AND created_at < NOW() - INTERVAL '1 hour';

-- 9. Criar índice para melhorar performance de busca por remoteJid
CREATE INDEX IF NOT EXISTS idx_conversations_remote_jid ON conversations ((metadata->>'remoteJid'));
CREATE INDEX IF NOT EXISTS idx_contacts_phone ON contacts (phone);
CREATE INDEX IF NOT EXISTS idx_messages_conversation_created ON messages (conversation_id, created_at DESC);