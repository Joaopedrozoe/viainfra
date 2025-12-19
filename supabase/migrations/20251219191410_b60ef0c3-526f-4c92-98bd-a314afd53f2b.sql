-- Atualizar a conversa do Adao para usar o contato correto com telefone
UPDATE conversations 
SET 
  contact_id = 'b6ca0236-4533-4722-8473-693641e96db6',
  metadata = jsonb_set(
    COALESCE(metadata, '{}'::jsonb),
    '{remoteJid}',
    '"5511991480719@s.whatsapp.net"'
  ),
  updated_at = now()
WHERE id = '5d80fd12-1c42-4871-82af-15064f27f486';

-- Excluir o contato duplicado sem telefone
DELETE FROM contacts WHERE id = '328f1664-5041-4df6-8f70-52d9c1ec1b71';