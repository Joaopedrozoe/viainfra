-- 1. Mover mensagens da conversa LID para a conversa correta
UPDATE messages 
SET conversation_id = 'fd52c009-c3f6-4933-8e06-92bc10dc0e32'
WHERE conversation_id = '156f6af1-5502-4a84-9b5e-4b1b0a82bdf7';

-- 2. Atualizar contato do Yago com nome correto e telefone
UPDATE contacts
SET 
  name = 'Yago M Sam',
  phone = '551120854990',
  updated_at = now()
WHERE id = '315cc5d7-a6ad-4a8e-8b3f-91d65e3b0721';

-- 3. Garantir conversa correta está ativa e atualizada
UPDATE conversations
SET 
  status = 'open',
  archived = false,
  updated_at = now(),
  metadata = jsonb_set(
    COALESCE(metadata, '{}'::jsonb),
    '{remoteJid}',
    '"551120854990@s.whatsapp.net"'
  )
WHERE id = 'fd52c009-c3f6-4933-8e06-92bc10dc0e32';

-- 4. Deletar a conversa problemática do LID
DELETE FROM conversations 
WHERE id = '156f6af1-5502-4a84-9b5e-4b1b0a82bdf7';