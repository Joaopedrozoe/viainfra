
-- Criar índice ÚNICO para messageId - impedir duplicatas no nível do banco de dados
-- Isso funciona independente de concorrência ou race conditions
CREATE UNIQUE INDEX IF NOT EXISTS messages_unique_message_id 
ON messages ((metadata->>'messageId')) 
WHERE metadata->>'messageId' IS NOT NULL;
