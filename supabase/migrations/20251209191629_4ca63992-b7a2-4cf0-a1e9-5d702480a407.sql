-- Clear old WhatsApp URLs for contacts without available pictures (privacy)
UPDATE contacts 
SET avatar_url = NULL, updated_at = now()
WHERE avatar_url LIKE '%pps.whatsapp.net%';