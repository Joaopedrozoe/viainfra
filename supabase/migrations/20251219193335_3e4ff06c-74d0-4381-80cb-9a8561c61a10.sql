-- Mover mensagens do contato duplicado para a conversa principal MPR
UPDATE messages 
SET conversation_id = '6033f765-cb84-45ff-858c-ea51fc444529'
WHERE conversation_id = '62876559-3925-410d-adf4-d9ddffad40e2';

-- Deletar conversa duplicada
DELETE FROM conversations WHERE id = '62876559-3925-410d-adf4-d9ddffad40e2';

-- Deletar contato duplicado sem telefone
DELETE FROM contacts WHERE id = 'f06c702f-f363-4e5e-91b8-ff8a0cd2d647';