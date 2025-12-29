
-- ============================================================
-- ETAPA 1: Limpar duplicatas ANTES de criar índices únicos
-- ============================================================

-- 1. Mover mensagens das conversas duplicadas "Via Infra" para a mais antiga
UPDATE messages 
SET conversation_id = 'bc882d99-7782-47df-ad03-50bef7a2d561'
WHERE conversation_id IN ('64be6ce2-2bef-49e8-a5a1-2dc07f0b878b', '8cf83387-f95f-448a-a37c-a50aeee03716');

-- 2. Deletar conversas duplicadas "Via Infra"
DELETE FROM conversations 
WHERE id IN ('64be6ce2-2bef-49e8-a5a1-2dc07f0b878b', '8cf83387-f95f-448a-a37c-a50aeee03716');

-- 3. Deletar contatos órfãos das conversas deletadas (Via Infra duplicados)
DELETE FROM contacts 
WHERE id IN (
  SELECT c.contact_id FROM (
    SELECT DISTINCT contact_id FROM conversations 
    WHERE id IN ('64be6ce2-2bef-49e8-a5a1-2dc07f0b878b', '8cf83387-f95f-448a-a37c-a50aeee03716')
  ) c
  WHERE NOT EXISTS (
    SELECT 1 FROM conversations WHERE contact_id = c.contact_id
  )
);
