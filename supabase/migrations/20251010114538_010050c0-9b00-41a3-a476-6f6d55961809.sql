
-- Atualizar política de messages para permitir que edge functions criem mensagens
-- e usuários autenticados vejam mensagens das suas conversas

-- Remover políticas antigas
DROP POLICY IF EXISTS "Messages: Deny all anonymous access" ON messages;

-- Política para service_role (edge functions)
CREATE POLICY "Allow service role to manage messages"
ON messages
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Recriar política de SELECT para usuários autenticados
DROP POLICY IF EXISTS "Users can view messages from their company conversations" ON messages;

CREATE POLICY "Users can view messages from their company conversations"
ON messages
FOR SELECT
TO authenticated
USING (
  conversation_id IN (
    SELECT id
    FROM conversations
    WHERE company_id IN (
      SELECT company_id 
      FROM profiles 
      WHERE user_id = auth.uid()
    )
  )
);

-- Política de INSERT para usuários autenticados
DROP POLICY IF EXISTS "Users can insert messages to their company conversations" ON messages;

CREATE POLICY "Users can insert messages to their company conversations"
ON messages
FOR INSERT
TO authenticated
WITH CHECK (
  conversation_id IN (
    SELECT id
    FROM conversations
    WHERE company_id IN (
      SELECT company_id 
      FROM profiles 
      WHERE user_id = auth.uid()
    )
  )
);

-- Política de UPDATE para usuários autenticados
DROP POLICY IF EXISTS "Users can update messages from their company conversations" ON messages;

CREATE POLICY "Users can update messages from their company conversations"
ON messages
FOR UPDATE
TO authenticated
USING (
  conversation_id IN (
    SELECT id
    FROM conversations
    WHERE company_id IN (
      SELECT company_id 
      FROM profiles 
      WHERE user_id = auth.uid()
    )
  )
);
