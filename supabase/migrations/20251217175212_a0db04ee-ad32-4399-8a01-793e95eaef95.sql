-- Limpar conversas WhatsApp sem mensagens (foram importadas sem histórico)
DELETE FROM conversations 
WHERE id IN (
  SELECT c.id 
  FROM conversations c
  LEFT JOIN messages m ON m.conversation_id = c.id
  WHERE c.channel = 'whatsapp'
  GROUP BY c.id
  HAVING COUNT(m.id) = 0
);