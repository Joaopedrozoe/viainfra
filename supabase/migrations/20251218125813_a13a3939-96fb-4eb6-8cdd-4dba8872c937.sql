-- Remove duplicate messages keeping the oldest one for each messageId per conversation
DELETE FROM messages 
WHERE id IN (
  SELECT id FROM (
    SELECT id, 
           ROW_NUMBER() OVER (
             PARTITION BY conversation_id, metadata->>'messageId' 
             ORDER BY created_at ASC
           ) as rn
    FROM messages 
    WHERE metadata->>'messageId' IS NOT NULL
  ) duplicates
  WHERE rn > 1
)