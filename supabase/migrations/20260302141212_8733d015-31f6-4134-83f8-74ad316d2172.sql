-- Fix VIALOGISTICOFICIAL: reassign instance, conversations, and contacts to VIALOGISTIC company
-- Step 1: Fix the instance company_id
UPDATE whatsapp_instances 
SET company_id = 'e3ad9c68-cf12-4e39-a12d-3f3068e975a0',
    updated_at = now()
WHERE instance_name = 'VIALOGISTICOFICIAL';

-- Step 2: Move all 18 conversations to VIALOGISTIC
UPDATE conversations 
SET company_id = 'e3ad9c68-cf12-4e39-a12d-3f3068e975a0'
WHERE metadata->>'instanceName' = 'VIALOGISTICOFICIAL';

-- Step 3: Move associated contacts to VIALOGISTIC
UPDATE contacts 
SET company_id = 'e3ad9c68-cf12-4e39-a12d-3f3068e975a0'
WHERE id IN (
    SELECT DISTINCT contact_id 
    FROM conversations 
    WHERE metadata->>'instanceName' = 'VIALOGISTICOFICIAL' 
    AND contact_id IS NOT NULL
);