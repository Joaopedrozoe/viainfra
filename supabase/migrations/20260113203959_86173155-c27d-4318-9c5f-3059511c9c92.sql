-- 1. Mover mensagens da conversa duplicada para a original
UPDATE messages 
SET conversation_id = '8ca7b302-6bbc-4669-8182-a041b86ce939'
WHERE conversation_id = '4f650faf-7898-49cc-ba86-f4fdfd9eed11';

-- 2. Deletar conversa duplicada
DELETE FROM conversations WHERE id = '4f650faf-7898-49cc-ba86-f4fdfd9eed11';

-- 3. Deletar contato duplicado (o que tem nome de LID)
DELETE FROM contacts WHERE id = '8dea4bda-47e2-4c45-8f12-cc8b78cc1bbf';

-- 4. Criar mapeamento LID → telefone para Videl Peças
INSERT INTO lid_phone_mapping (lid, phone, contact_id, company_id, instance_name)
SELECT '122033543340193', '5511976795974', '57914925-c14c-4b24-9f3c-926863a7fd42', 
       company_id, 'VIAINFRAOFICIAL'
FROM contacts WHERE id = '57914925-c14c-4b24-9f3c-926863a7fd42'
ON CONFLICT (lid, company_id) DO NOTHING;