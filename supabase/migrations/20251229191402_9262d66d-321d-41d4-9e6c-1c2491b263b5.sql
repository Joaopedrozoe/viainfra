-- CORREÇÃO: Atualizar updated_at da conversa Jairo (+55 11 98872-7845)
-- para refletir corretamente a última mensagem real

UPDATE conversations 
SET updated_at = (
  SELECT MAX(created_at) 
  FROM messages 
  WHERE conversation_id = '566d3343-8288-49cc-83e1-03b3c98f9932'
)
WHERE id = '566d3343-8288-49cc-83e1-03b3c98f9932';