
-- DESABILITAR TRIGGER TEMPORARIAMENTE
ALTER TABLE conversations DISABLE TRIGGER update_conversations_updated_at;

-- MOVER CONVERSAS QUE NÃO ESTÃO NO TOP 9 DO WHATSAPP WEB PARA ANTES DE 18:54
-- (Giovanna é a 9ª posição com 18:54:06)

-- Flávia
UPDATE conversations SET updated_at = '2025-12-18 18:40:00+00'::timestamptz
WHERE id = '2fbbe295-6942-4bda-b903-09b06a0fe950';

-- Sol E Fio
UPDATE conversations SET updated_at = '2025-12-18 18:39:00+00'::timestamptz
WHERE id = '80a4dbb6-ed33-4a3a-b376-045127c10057';

-- Tork Tacógrafos
UPDATE conversations SET updated_at = '2025-12-18 18:38:00+00'::timestamptz
WHERE id = 'fd52c009-c3f6-4933-8e06-92bc10dc0e32';

-- Elisabete
UPDATE conversations SET updated_at = '2025-12-18 18:37:00+00'::timestamptz
WHERE id = 'cc8fff1b-c80e-4e9b-8b27-7266e49ad54d';

-- Suh Almeida💜
UPDATE conversations SET updated_at = '2025-12-18 18:36:00+00'::timestamptz
WHERE id = 'e39568c3-4a86-477e-a706-22e2d9f5010e';

-- VIAINFRA-FINANCEIRO
UPDATE conversations SET updated_at = '2025-12-18 18:35:00+00'::timestamptz
WHERE id = '821337f1-c037-41dd-a8cf-6f0111ab21dc';

-- 5511963162225
UPDATE conversations SET updated_at = '2025-12-18 18:34:00+00'::timestamptz
WHERE id = 'a9b3ede4-9d26-41fb-9c79-d73dd2919c09';

-- Videl Peças
UPDATE conversations SET updated_at = '2025-12-18 18:33:00+00'::timestamptz
WHERE id = '8ca7b302-6bbc-4669-8182-a041b86ce939';

-- Joao Pedro (resolved)
UPDATE conversations SET updated_at = '2025-12-18 18:32:00+00'::timestamptz
WHERE id = '91236c6e-49c5-497e-ad92-6fc6c9578d67';

-- Isabel Boff Pereira (resolved)
UPDATE conversations SET updated_at = '2025-12-18 18:31:00+00'::timestamptz
WHERE id = '4af323fb-bfec-424e-9232-b47f74bda49b';

-- VI - NOTA FISCAL E COMPROVANTE
UPDATE conversations SET updated_at = '2025-12-18 18:30:00+00'::timestamptz
WHERE id = 'bee02b39-5477-4faa-8d04-ee57eca62de3';

-- Serviço SP (resolved)
UPDATE conversations SET updated_at = '2025-12-18 18:29:00+00'::timestamptz
WHERE id = 'd02e88c8-2c21-4ec1-8495-54a61dfc0ca2';

-- joicy (resolved)
UPDATE conversations SET updated_at = '2025-12-18 18:28:00+00'::timestamptz
WHERE id = 'd9bcbb3a-6c0b-41dc-8eb1-55be862e46d1';

-- 553599534971 (resolved)
UPDATE conversations SET updated_at = '2025-12-18 18:27:00+00'::timestamptz
WHERE id = 'b5850537-0129-42de-b554-0d7cc1fe1b42';

-- Marcelo
UPDATE conversations SET updated_at = '2025-12-18 18:26:00+00'::timestamptz
WHERE id = '5145b13e-8721-4777-8d34-64c867e13cc4';

-- Adao Alves de Araujo
UPDATE conversations SET updated_at = '2025-12-18 18:25:00+00'::timestamptz
WHERE id = 'bf3f3b37-196f-491d-9f9f-3abca535c56f';

-- Mover todas as outras conversas não listadas para timestamps anteriores (em batch)
UPDATE conversations SET updated_at = '2025-12-18 18:00:00+00'::timestamptz
WHERE channel = 'whatsapp' 
AND id NOT IN (
  '566d3343-8288-49cc-83e1-03b3c98f9932', -- Jairo
  '18f47bb1-db28-488c-bcbd-a1b50ebd2740', -- Via & T.Informatica
  '31cbab2d-ecd8-4389-8754-a5e711d4260d', -- Anthony Informatica
  'c662a740-fbdd-4a2a-986b-0bf4e0e2a85d', -- Serviços Zigurate
  'b2c3d4e5-f6a7-8901-bcde-f12345678901', -- Joao de Lima Junior
  '7d35a181-f1ef-4c50-9ce1-18e1c37170da', -- Flavio Gonçalves
  '5c15432d-f614-4e1e-b229-7ccc7d61f835', -- Fabrício
  '14963600-04c5-431f-8cc3-a1d537f6b758', -- VIAINFRA-RH
  'b5ae0c99-91fb-420b-a687-590dac429766', -- Giovanna
  '2fbbe295-6942-4bda-b903-09b06a0fe950', -- Flávia
  '80a4dbb6-ed33-4a3a-b376-045127c10057', -- Sol E Fio
  'fd52c009-c3f6-4933-8e06-92bc10dc0e32', -- Tork Tacógrafos
  'cc8fff1b-c80e-4e9b-8b27-7266e49ad54d', -- Elisabete
  'e39568c3-4a86-477e-a706-22e2d9f5010e', -- Suh Almeida💜
  '821337f1-c037-41dd-a8cf-6f0111ab21dc', -- VIAINFRA-FINANCEIRO
  'a9b3ede4-9d26-41fb-9c79-d73dd2919c09', -- 5511963162225
  '8ca7b302-6bbc-4669-8182-a041b86ce939', -- Videl Peças
  '91236c6e-49c5-497e-ad92-6fc6c9578d67', -- Joao Pedro
  '4af323fb-bfec-424e-9232-b47f74bda49b', -- Isabel Boff Pereira
  'bee02b39-5477-4faa-8d04-ee57eca62de3', -- VI - NOTA FISCAL E COMPROVANTE
  'd02e88c8-2c21-4ec1-8495-54a61dfc0ca2', -- Serviço SP
  'd9bcbb3a-6c0b-41dc-8eb1-55be862e46d1', -- joicy
  'b5850537-0129-42de-b554-0d7cc1fe1b42', -- 553599534971
  '5145b13e-8721-4777-8d34-64c867e13cc4', -- Marcelo
  'bf3f3b37-196f-491d-9f9f-3abca535c56f', -- Adao Alves de Araujo
  'add12ae7-1639-43f7-95b1-e060efcaab9f', -- Luis Pirata
  '10076e35-5184-4008-82e3-d2dd0d30a2f7', -- Gerente Claro
  'ca50d581-332b-4263-be99-5570facec45e'  -- Atendimento Viainfra
)
AND updated_at > '2025-12-18 18:00:00+00'::timestamptz;

-- REABILITAR TRIGGER
ALTER TABLE conversations ENABLE TRIGGER update_conversations_updated_at;
