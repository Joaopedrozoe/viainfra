
-- 1. Move messages from duplicate conversation to the correct one
UPDATE messages 
SET conversation_id = '24962a1a-b912-443b-8e81-34a0675f7ae5'
WHERE conversation_id = 'fb1d3453-13c8-4a50-bf44-187b59e56be1';

-- 2. Delete the duplicate conversation
DELETE FROM conversations 
WHERE id = 'fb1d3453-13c8-4a50-bf44-187b59e56be1';

-- 3. Delete the orphan contact (no phone, duplicate)
DELETE FROM contacts 
WHERE id = '0c21d411-917d-4502-8085-7ff1a7890ef2';
