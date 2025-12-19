-- Remover mensagens que foram parar em conversas @lid erradas
-- Conversa "E A Claro" (156f6af1-5502-4a84-9b5e-4b1b0a82bdf7) tinha mensagens de outros contatos

DELETE FROM messages 
WHERE conversation_id = '156f6af1-5502-4a84-9b5e-4b1b0a82bdf7'
AND (
  metadata->>'sender_name' = 'Eliomar Alves - Almoxarife Zigurate' 
  OR metadata->>'sender_name' = 'mpr comércio e manutenções'
);

-- Atualizar conversas @lid para ter o nome correto baseado nas mensagens restantes
-- Atualizar a conversa E A Claro para ter updated_at correto
UPDATE conversations
SET updated_at = (
  SELECT MAX(created_at) 
  FROM messages 
  WHERE conversation_id = '156f6af1-5502-4a84-9b5e-4b1b0a82bdf7'
)
WHERE id = '156f6af1-5502-4a84-9b5e-4b1b0a82bdf7';