-- Delete conversations that have 0 messages
DELETE FROM conversations 
WHERE id IN (
  SELECT c.id 
  FROM conversations c 
  LEFT JOIN messages m ON m.conversation_id = c.id 
  WHERE c.company_id = 'da17735c-5a76-4797-b338-f6e63a7b3f8b' 
  AND c.channel = 'whatsapp'
  GROUP BY c.id
  HAVING COUNT(m.id) = 0
);