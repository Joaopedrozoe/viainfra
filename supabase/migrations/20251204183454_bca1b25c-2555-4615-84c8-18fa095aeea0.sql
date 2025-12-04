
-- Delete WhatsApp conversations that have no messages (shouldn't be in inbox)
-- Keep web channel conversations as they're valid
DELETE FROM public.conversations 
WHERE channel = 'whatsapp'
AND id NOT IN (
  SELECT DISTINCT conversation_id 
  FROM public.messages 
  WHERE conversation_id IS NOT NULL
);
