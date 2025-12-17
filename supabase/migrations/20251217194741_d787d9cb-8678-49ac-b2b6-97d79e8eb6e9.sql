-- CONSOLIDAÇÃO DE DUPLICATAS @LID
-- Mover mensagens das conversas @lid para as conversas com telefone real

-- 1. Joicy Oliveira: @lid → real
UPDATE messages SET conversation_id = '48c99f83-925c-407f-8b78-60b77ee45311'
WHERE conversation_id = '556546fe-b28c-48bc-8128-0f5c61188871'
AND id NOT IN (SELECT id FROM messages WHERE conversation_id = '48c99f83-925c-407f-8b78-60b77ee45311');

-- 2. Via Logistic: @lid → real
UPDATE messages SET conversation_id = 'b64bfff8-7ac1-4845-a1ed-c230c9f23d9a'
WHERE conversation_id = '98582bcd-0ae9-4e56-b37a-ec0b2ce931a6'
AND id NOT IN (SELECT id FROM messages WHERE conversation_id = 'b64bfff8-7ac1-4845-a1ed-c230c9f23d9a');

-- 3. Suh Almeida: @lid → real
UPDATE messages SET conversation_id = 'e39568c3-4a86-477e-a706-22e2d9f5010e'
WHERE conversation_id = '866fcd68-d61c-4c57-9ccd-b560144cf055'
AND id NOT IN (SELECT id FROM messages WHERE conversation_id = 'e39568c3-4a86-477e-a706-22e2d9f5010e');

-- 4. Sol E Fio: @lid → real
UPDATE messages SET conversation_id = '80a4dbb6-ed33-4a3a-b376-045127c10057'
WHERE conversation_id = 'a7428a2e-bff4-44a0-83ff-cdf27c21934a'
AND id NOT IN (SELECT id FROM messages WHERE conversation_id = '80a4dbb6-ed33-4a3a-b376-045127c10057');

-- Deletar conversas @lid duplicadas (após mover mensagens)
DELETE FROM conversations WHERE id IN (
  '556546fe-b28c-48bc-8128-0f5c61188871',  -- Joicy @lid
  '98582bcd-0ae9-4e56-b37a-ec0b2ce931a6',  -- Via Logistic @lid
  '866fcd68-d61c-4c57-9ccd-b560144cf055',  -- Suh @lid
  'a7428a2e-bff4-44a0-83ff-cdf27c21934a'   -- Sol E Fio @lid
);

-- Deletar contatos @lid que têm duplicata com telefone
DELETE FROM contacts WHERE id IN (
  '0799a1be-555b-4dd1-ad71-eabfb093ee73',  -- Joicy @lid
  '4c07b0a7-465e-4cda-9e0c-7416ed5dffb8',  -- Via Logistic @lid
  '10fb5f66-c63c-432d-a7b9-bdb79c8b4675',  -- Suh @lid
  '49ce2bc1-cb22-435d-95a7-073ee58fbf4a'   -- Sol E Fio @lid
);

-- Deletar TODAS conversas @lid restantes (sem contato real correspondente)
-- Primeiro deletar mensagens
DELETE FROM messages WHERE conversation_id IN (
  SELECT conv.id FROM conversations conv
  JOIN contacts c ON conv.contact_id = c.id
  WHERE conv.company_id = 'da17735c-5a76-4797-b338-f6e63a7b3f8b'
  AND c.metadata->>'idType' = 'lid'
);

-- Depois deletar conversas
DELETE FROM conversations WHERE id IN (
  SELECT conv.id FROM conversations conv
  JOIN contacts c ON conv.contact_id = c.id
  WHERE conv.company_id = 'da17735c-5a76-4797-b338-f6e63a7b3f8b'
  AND c.metadata->>'idType' = 'lid'
);

-- Por fim, deletar contatos @lid sem telefone
DELETE FROM contacts 
WHERE company_id = 'da17735c-5a76-4797-b338-f6e63a7b3f8b'
AND metadata->>'idType' = 'lid'
AND phone IS NULL;