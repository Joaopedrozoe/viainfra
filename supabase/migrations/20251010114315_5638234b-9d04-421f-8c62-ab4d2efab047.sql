
-- Remover política restritiva antiga e criar nova mais permissiva
DROP POLICY IF EXISTS "Deny public access to conversations" ON conversations;
DROP POLICY IF EXISTS "Conversations: Deny all anonymous access" ON conversations;

-- Política para permitir que edge functions criem conversas
CREATE POLICY "Allow service role to manage conversations"
ON conversations
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Política para permitir que usuários autenticados vejam conversas da sua company
-- Esta já existe, mas vou recriar para garantir
DROP POLICY IF EXISTS "Users can view conversations from their company" ON conversations;

CREATE POLICY "Users can view conversations from their company"
ON conversations
FOR SELECT
TO authenticated
USING (
  company_id IN (
    SELECT company_id 
    FROM profiles 
    WHERE user_id = auth.uid()
  )
);
