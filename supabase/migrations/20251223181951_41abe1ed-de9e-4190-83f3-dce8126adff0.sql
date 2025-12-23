-- MESCLAGEM COMPLETA: João de Lima Junior -> Eliomar Alves

-- 1. Mover mensagens da conversa do João para conversa do Eliomar
UPDATE messages 
SET conversation_id = '26ec8c81-f389-4c73-90ae-b81f9f1f6626'
WHERE conversation_id = 'b2c3d4e5-f6a7-8901-bcde-f12345678901';

-- 2. Deletar conversa duplicada do João
DELETE FROM conversations 
WHERE id = 'b2c3d4e5-f6a7-8901-bcde-f12345678901';

-- 3. Remover contato duplicado João
DELETE FROM contacts 
WHERE id = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890';

-- 4. Atualizar telefone do Eliomar
UPDATE contacts 
SET 
  phone = '5511992511175',
  metadata = jsonb_set(
    jsonb_set(
      COALESCE(metadata, '{}'::jsonb),
      '{phoneResolved}',
      'true'
    ),
    '{mergedFrom}',
    '"Joao de Lima Junior"'
  )
WHERE id = 'dd9f4ce3-9b7f-448c-a8ed-4f2a39ea820f';

-- 5. Corrigir updated_at das conversas para refletir última mensagem
UPDATE conversations conv
SET updated_at = (
  SELECT COALESCE(MAX(m.created_at), conv.created_at)
  FROM messages m
  WHERE m.conversation_id = conv.id
)
WHERE conv.company_id = 'da17735c-5a76-4797-b338-f6e63a7b3f8b';

-- 6. Atualizar os 2 contatos com nome numérico
UPDATE contacts
SET name = 'Contato ' || name
WHERE id IN ('b74c3bd6-a95b-4c9c-9b1b-5b7d7c16b8d7', 'f113e32c-aeae-4a1f-bdc6-dd885dde2ebe')
AND name ~ '^\d+$';

-- 7. Atualizar Luiz Almoxarife com telefone real
UPDATE contacts
SET 
  phone = '5511915219788',
  metadata = jsonb_set(
    jsonb_set(
      COALESCE(metadata, '{}'::jsonb),
      '{phoneResolved}',
      'true'
    ),
    '{originalLid}',
    '"22544837029978@lid"'
  )
WHERE id = 'e79c9242-f424-4c85-b9a3-d55ec53246f9';