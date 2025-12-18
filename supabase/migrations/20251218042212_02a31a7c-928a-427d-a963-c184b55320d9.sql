-- Corrigir associação da instância VIAINFRAOFICIAL para a empresa VIAINFRA
UPDATE whatsapp_instances 
SET company_id = 'da17735c-5a76-4797-b338-f6e63a7b3f8b'
WHERE instance_name = 'VIAINFRAOFICIAL';