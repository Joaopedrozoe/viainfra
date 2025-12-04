-- Delete duplicate resolved conversations, keeping only the most recent per contact+channel
DELETE FROM messages WHERE conversation_id IN (
  SELECT id FROM conversations c1
  WHERE status = 'resolved'
  AND EXISTS (
    SELECT 1 FROM conversations c2
    WHERE c2.contact_id = c1.contact_id
    AND c2.channel = c1.channel
    AND c2.status = 'resolved'
    AND c2.updated_at > c1.updated_at
  )
);

DELETE FROM conversations c1
WHERE status = 'resolved'
AND EXISTS (
  SELECT 1 FROM conversations c2
  WHERE c2.contact_id = c1.contact_id
  AND c2.channel = c1.channel
  AND c2.status = 'resolved'
  AND c2.updated_at > c1.updated_at
);