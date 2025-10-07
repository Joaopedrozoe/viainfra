-- Permitir acesso público a mensagens de conversas web (incluindo mensagens de agentes)
DROP POLICY IF EXISTS "Allow public to view web conversation messages" ON messages;

CREATE POLICY "Allow public web widget access to messages"
ON messages
FOR SELECT
USING (
  conversation_id IN (
    SELECT id FROM conversations WHERE channel = 'web'
  )
);