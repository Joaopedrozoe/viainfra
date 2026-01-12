
-- Delete the duplicate LID conversation and contact
-- First, delete messages from the LID conversation
DELETE FROM messages WHERE conversation_id = '7aaf91fb-771a-44d9-bde4-b6b6427013d3';

-- Delete the LID conversation
DELETE FROM conversations WHERE id = '7aaf91fb-771a-44d9-bde4-b6b6427013d3';

-- Delete the LID contact
DELETE FROM contacts WHERE id = 'f885a6d2-704f-4689-8fab-1984c869f581';

-- Also cleanup the other LID contact (182355889279168@lid)
DELETE FROM messages WHERE conversation_id IN (
  SELECT id FROM conversations WHERE contact_id = 'c8b9567f-4bc4-4a64-82b5-7641d17854ba'
);
DELETE FROM conversations WHERE contact_id = 'c8b9567f-4bc4-4a64-82b5-7641d17854ba';
DELETE FROM contacts WHERE id = 'c8b9567f-4bc4-4a64-82b5-7641d17854ba';

-- Add LID mapping to prevent future duplicates
INSERT INTO lid_phone_mapping (lid, phone, contact_id, company_id, instance_name)
VALUES (
  '64807298437256',
  '5511945703884',
  '1daa5f94-f254-4bf7-9673-b8d3c750a161',
  'da17735c-5a76-4797-b338-f6e63a7b3f8b',
  'VIAINFRAOFICIAL'
)
ON CONFLICT (lid, company_id) DO UPDATE SET 
  phone = EXCLUDED.phone,
  contact_id = EXCLUDED.contact_id,
  updated_at = now();

-- Update the conversation for Julio Lopes to include the lidJid for future matching
UPDATE conversations 
SET metadata = jsonb_set(
  COALESCE(metadata, '{}'::jsonb),
  '{lidJid}',
  '"64807298437256@lid"'::jsonb
)
WHERE id = '414436cf-610c-495d-bfd1-2639c837d96d';
