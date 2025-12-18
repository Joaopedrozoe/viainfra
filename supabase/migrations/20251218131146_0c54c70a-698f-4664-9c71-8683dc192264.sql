-- Delete messages from incorrect conversation
DELETE FROM messages WHERE conversation_id = '49fcf8f8-1b8b-4570-a0fc-12a7cb843981';

-- Delete the incorrect conversation
DELETE FROM conversations WHERE id = '49fcf8f8-1b8b-4570-a0fc-12a7cb843981';

-- Delete the incorrect contact
DELETE FROM contacts WHERE id = 'f17f96f4-c3e6-4a94-9783-9046bde770a3';