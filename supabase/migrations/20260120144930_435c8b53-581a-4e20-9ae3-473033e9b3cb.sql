
-- STEP 1: Fix the instance association - VIAINFRAOFICIAL belongs to VIAINFRA company
UPDATE whatsapp_instances 
SET company_id = 'da17735c-5a76-4797-b338-f6e63a7b3f8b'
WHERE instance_name = 'VIAINFRAOFICIAL';

-- STEP 2: Delete VIALOGISTIC's duplicate contacts (VIALOGISTIC should have no operational data)
-- First, get conversation IDs from VIALOGISTIC to handle message deletion
DELETE FROM messages 
WHERE conversation_id IN (
  SELECT id FROM conversations 
  WHERE company_id = 'e3ad9c68-cf12-4e39-a12d-3f3068e975a0'
);

-- Delete conversations from VIALOGISTIC
DELETE FROM conversations 
WHERE company_id = 'e3ad9c68-cf12-4e39-a12d-3f3068e975a0';

-- Delete contacts from VIALOGISTIC
DELETE FROM contacts 
WHERE company_id = 'e3ad9c68-cf12-4e39-a12d-3f3068e975a0';

-- Delete LID mappings from VIALOGISTIC
DELETE FROM lid_phone_mapping
WHERE company_id = 'e3ad9c68-cf12-4e39-a12d-3f3068e975a0';
