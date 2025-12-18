
-- Limpeza absoluta final VIALOGISTIC
DELETE FROM messages WHERE conversation_id IN (SELECT id FROM conversations WHERE company_id = 'e3ad9c68-cf12-4e39-a12d-3f3068e975a0');
DELETE FROM conversations WHERE company_id = 'e3ad9c68-cf12-4e39-a12d-3f3068e975a0';
DELETE FROM contacts WHERE company_id = 'e3ad9c68-cf12-4e39-a12d-3f3068e975a0';
