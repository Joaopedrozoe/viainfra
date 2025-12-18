-- Deletar conversas vazias (sem mensagens) da VIAINFRA
DELETE FROM conversations 
WHERE company_id = 'da17735c-5a76-4797-b338-f6e63a7b3f8b'
AND channel = 'whatsapp'
AND NOT EXISTS (SELECT 1 FROM messages m WHERE m.conversation_id = conversations.id);