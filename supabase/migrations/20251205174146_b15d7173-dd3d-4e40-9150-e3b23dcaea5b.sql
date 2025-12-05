-- Delete conversations and contacts created from wrong instances (invalid phone numbers)
-- These are from TINFO and JUNIORCORRETOR instances that shouldn't be synced

-- First delete messages
DELETE FROM messages 
WHERE conversation_id IN (
  SELECT c.id FROM conversations c
  JOIN contacts ct ON c.contact_id = ct.id
  WHERE c.company_id = 'da17735c-5a76-4797-b338-f6e63a7b3f8b'
  AND c.channel = 'whatsapp'
  AND ct.phone IS NOT NULL
  AND (
    -- Numbers too short (invalid Brazilian format)
    LENGTH(ct.phone) < 12
    OR 
    -- Numbers that don't look like valid Brazilian WhatsApp numbers
    ct.phone !~ '^55[1-9][0-9]9?[0-9]{8}$'
  )
);

-- Then delete conversations
DELETE FROM conversations 
WHERE id IN (
  SELECT c.id FROM conversations c
  JOIN contacts ct ON c.contact_id = ct.id
  WHERE c.company_id = 'da17735c-5a76-4797-b338-f6e63a7b3f8b'
  AND c.channel = 'whatsapp'
  AND ct.phone IS NOT NULL
  AND (
    LENGTH(ct.phone) < 12
    OR 
    ct.phone !~ '^55[1-9][0-9]9?[0-9]{8}$'
  )
);

-- Delete orphan contacts with invalid phones
DELETE FROM contacts 
WHERE company_id = 'da17735c-5a76-4797-b338-f6e63a7b3f8b'
AND phone IS NOT NULL
AND (
  LENGTH(phone) < 12
  OR 
  phone !~ '^55[1-9][0-9]9?[0-9]{8}$'
)
AND id NOT IN (SELECT contact_id FROM conversations WHERE contact_id IS NOT NULL);