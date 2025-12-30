
-- 1. Mover mensagens que mencionam Flávia/Via Logistic para a conversa da Flávia
-- Essas mensagens foram importadas erroneamente na conversa do Yago

-- Mensagens que claramente são da Flávia e não do Yago:
-- - "Flávia, ontem a Msam gerou..."
-- - "Precisa que gere uma nota de devolução..."
-- - "[Imagem]" às 17:53:27 (2 delas)
-- - "[Imagem]" às 18:01:22

-- Mover para a conversa da Flávia
UPDATE messages
SET conversation_id = '7d994378-6a3e-46a5-b188-c349beab6e71'
WHERE id IN (
  '5cee5bac-ae5a-4255-97c0-7b337555b54b', -- Flávia, ontem a Msam gerou
  '3afd24d8-506e-4309-97fc-5e318976bf61', -- Precisa que gere uma nota de devolução
  '7b324d90-26d6-4e4b-beae-4ce74dff88dc', -- [Imagem] 17:53:27
  '93064505-ba54-4f59-837f-43e399fa552b', -- [Imagem] 17:53:27
  '4407ee58-c058-4ba6-88f4-ac8b3235dcd4'  -- [Imagem] 18:01:22
);

-- 2. Também mover mensagens do Yago que parecem ser sobre a conversa com Flávia
UPDATE messages
SET conversation_id = '7d994378-6a3e-46a5-b188-c349beab6e71'
WHERE id IN (
  '425a71a0-b4f1-4ea5-83f8-453700c10b7f', -- Falei que quando puder vou mandar as placas
  '57d4ac19-3848-450e-add6-27e17665e476'  -- Yago disse que o gestor dele não permite
);

-- 3. Deletar mensagens duplicadas do Yago (mesma mensagem aparece 2x)
DELETE FROM messages
WHERE id IN (
  '8bc5becf-b7fb-48da-8e2d-ea54b1a4ef6a', -- duplicada de belexuuura
  '1e61db97-7391-4943-95c3-7cd606b407cc', -- duplicada de blz amiga
  '92fc5259-c406-463f-b1c9-17614ab50a15', -- duplicada de fico no aguardo
  '88b9cdad-cc67-460b-a169-adaba57641e8'  -- [Contato] Flávia Financeiro - não pertence a Yago
);

-- 4. Atualizar timestamp das conversas
UPDATE conversations
SET updated_at = (SELECT MAX(created_at) FROM messages WHERE conversation_id = '61f82363-6d0b-496e-ba6d-8dc39b60a570')
WHERE id = '61f82363-6d0b-496e-ba6d-8dc39b60a570';

UPDATE conversations
SET updated_at = (SELECT MAX(created_at) FROM messages WHERE conversation_id = '7d994378-6a3e-46a5-b188-c349beab6e71')
WHERE id = '7d994378-6a3e-46a5-b188-c349beab6e71';
