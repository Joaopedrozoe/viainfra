
-- Add unique constraint to prevent duplicate WhatsApp conversations per contact
-- First drop if exists to avoid errors
DROP INDEX IF EXISTS idx_unique_whatsapp_conversation_per_contact;

-- Create unique partial index for whatsapp conversations (one per contact)
CREATE UNIQUE INDEX idx_unique_whatsapp_conversation_per_contact 
ON conversations (contact_id, channel) 
WHERE channel = 'whatsapp';
