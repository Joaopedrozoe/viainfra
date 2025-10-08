-- ========================================
-- REFORÇO DE SEGURANÇA: Garantir bloqueio absoluto de acesso público
-- Adicionar verificações explícitas de role para prevenir bypass
-- ========================================

-- PROFILES: Reforçar políticas com verificação de role
DROP POLICY IF EXISTS "Block all public access to profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can view only their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can view company colleagues profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can update only their own profile" ON public.profiles;

-- 1. Política RESTRICTIVE para garantir bloqueio total de anon
CREATE POLICY "Profiles: Deny all anonymous access"
ON public.profiles
AS RESTRICTIVE
FOR ALL
TO anon, public
USING (false)
WITH CHECK (false);

-- 2. Política RESTRICTIVE adicional verificando o role
CREATE POLICY "Profiles: Require authenticated role"
ON public.profiles
AS RESTRICTIVE
FOR ALL
TO authenticated
USING (auth.role() = 'authenticated' AND auth.uid() IS NOT NULL);

-- 3. Permitir visualização do próprio perfil (apenas authenticated)
CREATE POLICY "Profiles: View own profile"
ON public.profiles
FOR SELECT
TO authenticated
USING (
  auth.role() = 'authenticated' 
  AND auth.uid() IS NOT NULL 
  AND user_id = auth.uid()
);

-- 4. Permitir visualização de colegas da mesma empresa
CREATE POLICY "Profiles: View company colleagues"
ON public.profiles
FOR SELECT
TO authenticated
USING (
  auth.role() = 'authenticated'
  AND auth.uid() IS NOT NULL
  AND company_id IS NOT NULL
  AND company_id = get_user_company_id(auth.uid())
  AND user_id != auth.uid()
);

-- 5. Permitir atualização apenas do próprio perfil
CREATE POLICY "Profiles: Update own profile"
ON public.profiles
FOR UPDATE
TO authenticated
USING (
  auth.role() = 'authenticated'
  AND auth.uid() IS NOT NULL
  AND user_id = auth.uid()
)
WITH CHECK (
  auth.role() = 'authenticated'
  AND auth.uid() IS NOT NULL
  AND user_id = auth.uid()
);

-- CONTACTS: Reforçar políticas
DROP POLICY IF EXISTS "Deny public access to contacts" ON public.contacts;

CREATE POLICY "Contacts: Deny all anonymous access"
ON public.contacts
AS RESTRICTIVE
FOR ALL
TO anon, public
USING (false)
WITH CHECK (false);

CREATE POLICY "Contacts: Require authenticated role"
ON public.contacts
AS RESTRICTIVE  
FOR ALL
TO authenticated
USING (auth.role() = 'authenticated' AND auth.uid() IS NOT NULL);

-- Adicionar comentários de auditoria
COMMENT ON TABLE public.profiles IS 'RLS reforçado em 2025-01-07: Políticas RESTRICTIVE com verificação de role e uid para prevenir bypass de autenticação';
COMMENT ON TABLE public.contacts IS 'RLS reforçado em 2025-01-07: Políticas RESTRICTIVE com verificação de role para bloquear acesso público';
