
-- Remove duplicate WhatsApp conversations keeping only ONE per contact (the one with most messages)
WITH conversations_ranked AS (
  SELECT 
    c.id,
    c.contact_id,
    c.status,
    (SELECT COUNT(*) FROM messages m WHERE m.conversation_id = c.id) as msg_count,
    ROW_NUMBER() OVER (
      PARTITION BY c.contact_id 
      ORDER BY 
        (SELECT COUNT(*) FROM messages m WHERE m.conversation_id = c.id) DESC,
        c.updated_at DESC
    ) as rn
  FROM conversations c
  WHERE c.company_id IN (SELECT id FROM companies WHERE name ILIKE '%viainfra%')
  AND c.channel = 'whatsapp'
)
DELETE FROM conversations 
WHERE id IN (
  SELECT id FROM conversations_ranked WHERE rn > 1
);
