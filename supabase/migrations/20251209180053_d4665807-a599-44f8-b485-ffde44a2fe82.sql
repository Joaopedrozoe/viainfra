-- CONSOLIDAÇÃO: Mover mensagens e remover duplicatas de contatos @lid

-- 1. JOICY: A conversa df4dcc05 usa contato 0ad90163 que não tem phone
-- Mover mensagens para a conversa principal 48c99f83
UPDATE messages 
SET conversation_id = '48c99f83-925c-407f-8b78-60b77ee45311'
WHERE conversation_id = 'df4dcc05-a169-4c57-9f13-0b84cf6f5241';

-- Deletar conversa duplicada
DELETE FROM conversations WHERE id = 'df4dcc05-a169-4c57-9f13-0b84cf6f5241';

-- Deletar contato duplicado @lid da Joicy
DELETE FROM contacts WHERE id = '0ad90163-d453-42b0-a10a-0493340fc8c9';

-- 2. SUH: A conversa 6352380f usa contato f3c6ec1d que não tem phone
-- Mover mensagens para a conversa principal e39568c3
UPDATE messages 
SET conversation_id = 'e39568c3-4a86-477e-a706-22e2d9f5010e'
WHERE conversation_id = '6352380f-86a7-43c6-be32-f2f1c644c390';

-- Deletar conversa duplicada
DELETE FROM conversations WHERE id = '6352380f-86a7-43c6-be32-f2f1c644c390';

-- Deletar contato duplicado @lid da Suh
DELETE FROM contacts WHERE id = 'f3c6ec1d-90f2-47ee-a743-df098a14d04a';

-- 3. Corrigir nome do contato principal da Suh (está com número)
UPDATE contacts 
SET name = 'Suh Almeida💜',
    avatar_url = 'https://pps.whatsapp.net/v/t61.24694-24/521154071_1894845638119090_4787266179243992831_n.jpg?ccb=11-4&oh=01_Q5Aa3QFDI6nXrclraB6O_-RfrEg8lhr7s7ceHPLKH6z9wAFgnw&oe=694578BF&_nc_sid=5e03e0&_nc_cat=100',
    updated_at = now()
WHERE phone = '5511958035461' 
  AND company_id = 'da17735c-5a76-4797-b338-f6e63a7b3f8b';

-- 4. Reabrir conversas para teste do bot
UPDATE conversations 
SET status = 'open', 
    metadata = jsonb_set(
      jsonb_set(COALESCE(metadata, '{}'::jsonb), '{bot_triggered}', 'false'),
      '{bot_state}', '{"currentNodeId": "start", "collectedData": {}}'
    ),
    updated_at = now()
WHERE id IN ('48c99f83-925c-407f-8b78-60b77ee45311', 'e39568c3-4a86-477e-a706-22e2d9f5010e');