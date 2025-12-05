-- Delete conversations with invalid phone numbers (less than 11 digits for Brazilian numbers)
DELETE FROM messages 
WHERE conversation_id IN (
  SELECT c.id FROM conversations c
  JOIN contacts ct ON c.contact_id = ct.id
  WHERE c.company_id = 'da17735c-5a76-4797-b338-f6e63a7b3f8b'
  AND c.channel = 'whatsapp'
  AND (LENGTH(ct.phone) < 11 OR ct.phone !~ '^55[0-9]{10,11}$')
);

DELETE FROM conversations 
WHERE id IN (
  SELECT c.id FROM conversations c
  JOIN contacts ct ON c.contact_id = ct.id
  WHERE c.company_id = 'da17735c-5a76-4797-b338-f6e63a7b3f8b'
  AND c.channel = 'whatsapp'
  AND (LENGTH(ct.phone) < 11 OR ct.phone !~ '^55[0-9]{10,11}$')
);

-- Also delete invalid contacts (orphans)
DELETE FROM contacts 
WHERE company_id = 'da17735c-5a76-4797-b338-f6e63a7b3f8b'
AND (LENGTH(phone) < 11 OR phone !~ '^55[0-9]{10,11}$')
AND id NOT IN (SELECT contact_id FROM conversations WHERE contact_id IS NOT NULL);