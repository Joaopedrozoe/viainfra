
-- STEP 1: Delete ALL messages from VIALOGISTIC conversations
DELETE FROM messages 
WHERE conversation_id IN (
  SELECT id FROM conversations 
  WHERE company_id = 'e3ad9c68-cf12-4e39-a12d-3f3068e975a0'
);

-- STEP 2: Delete ALL conversations from VIALOGISTIC
DELETE FROM conversations 
WHERE company_id = 'e3ad9c68-cf12-4e39-a12d-3f3068e975a0';

-- STEP 3: Delete ALL contacts from VIALOGISTIC  
DELETE FROM contacts 
WHERE company_id = 'e3ad9c68-cf12-4e39-a12d-3f3068e975a0';

-- STEP 4: Delete ALL LID mappings from VIALOGISTIC
DELETE FROM lid_phone_mapping
WHERE company_id = 'e3ad9c68-cf12-4e39-a12d-3f3068e975a0';

-- STEP 5: Delete ALL chamados from VIALOGISTIC
DELETE FROM chamados
WHERE company_id = 'e3ad9c68-cf12-4e39-a12d-3f3068e975a0';

-- STEP 6: Delete ALL whatsapp statuses from VIALOGISTIC
DELETE FROM whatsapp_statuses
WHERE company_id = 'e3ad9c68-cf12-4e39-a12d-3f3068e975a0';

-- STEP 7: Delete ANY whatsapp instances from VIALOGISTIC
DELETE FROM whatsapp_instances
WHERE company_id = 'e3ad9c68-cf12-4e39-a12d-3f3068e975a0';
