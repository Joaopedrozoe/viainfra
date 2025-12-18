
-- Corrigir associação da instância VIAINFRAOFICIAL para empresa Viainfra
UPDATE whatsapp_instances 
SET company_id = 'da17735c-5a76-4797-b338-f6e63a7b3f8b'
WHERE instance_name = 'VIAINFRAOFICIAL';

-- Remover conversas vazias criadas na empresa errada (VIALOGISTIC)
DELETE FROM conversations 
WHERE company_id = 'e3ad9c68-cf12-4e39-a12d-3f3068e975a0'
AND channel = 'whatsapp'
AND id NOT IN (SELECT DISTINCT conversation_id FROM messages WHERE conversation_id IS NOT NULL);

-- Remover contatos órfãos da VIALOGISTIC que não têm conversas
DELETE FROM contacts 
WHERE company_id = 'e3ad9c68-cf12-4e39-a12d-3f3068e975a0'
AND id NOT IN (SELECT DISTINCT contact_id FROM conversations WHERE contact_id IS NOT NULL);
