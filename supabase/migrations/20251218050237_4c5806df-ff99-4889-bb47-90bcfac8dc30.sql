
-- LIMPAR VIALOGISTIC (e3ad9c68-cf12-4e39-a12d-3f3068e975a0)
-- Primeiro deletar mensagens das conversas
DELETE FROM messages WHERE conversation_id IN (
  SELECT id FROM conversations WHERE company_id = 'e3ad9c68-cf12-4e39-a12d-3f3068e975a0'
);

-- Deletar conversas
DELETE FROM conversations WHERE company_id = 'e3ad9c68-cf12-4e39-a12d-3f3068e975a0';

-- Deletar contatos
DELETE FROM contacts WHERE company_id = 'e3ad9c68-cf12-4e39-a12d-3f3068e975a0';

-- Deletar instâncias WhatsApp (exceto VIAINFRAOFICIAL que será movida)
DELETE FROM whatsapp_instances 
WHERE company_id = 'e3ad9c68-cf12-4e39-a12d-3f3068e975a0'
AND instance_name != 'VIAINFRAOFICIAL';

-- Mover VIAINFRAOFICIAL para Viainfra
UPDATE whatsapp_instances 
SET company_id = 'da17735c-5a76-4797-b338-f6e63a7b3f8b'
WHERE instance_name = 'VIAINFRAOFICIAL';
