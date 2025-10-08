-- ========================================
-- CORREÇÃO: Políticas RLS da tabela profiles
-- Resolver conflito entre políticas permissivas e restritivas
-- ========================================

-- Primeiro, remover todas as políticas SELECT existentes para reconstruir corretamente
DROP POLICY IF EXISTS "Authenticated users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Authenticated users can view profiles from their company" ON public.profiles;
DROP POLICY IF EXISTS "Deny public access to profiles" ON public.profiles;

-- 1. BLOQUEAR acesso público de forma RESTRITIVA (mais alta prioridade)
CREATE POLICY "Block all public access to profiles"
ON public.profiles
AS RESTRICTIVE
FOR ALL
TO anon
USING (false)
WITH CHECK (false);

-- 2. Permitir que usuários autenticados vejam APENAS seu próprio perfil
CREATE POLICY "Users can view only their own profile"
ON public.profiles
FOR SELECT
TO authenticated
USING (
  auth.uid() IS NOT NULL 
  AND user_id = auth.uid()
);

-- 3. Permitir que usuários autenticados vejam perfis da mesma empresa
-- APENAS se houver necessidade operacional (lista de colegas, etc)
CREATE POLICY "Users can view company colleagues profiles"
ON public.profiles
FOR SELECT
TO authenticated
USING (
  auth.uid() IS NOT NULL 
  AND company_id IS NOT NULL
  AND company_id = get_user_company_id(auth.uid())
  AND user_id != auth.uid() -- Evita duplicação com política anterior
);

-- 4. Garantir que usuários só podem atualizar seu próprio perfil
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;

CREATE POLICY "Users can update only their own profile"
ON public.profiles
FOR UPDATE
TO authenticated
USING (
  auth.uid() IS NOT NULL 
  AND user_id = auth.uid()
)
WITH CHECK (
  auth.uid() IS NOT NULL 
  AND user_id = auth.uid()
);

-- Adicionar comentário de auditoria
COMMENT ON TABLE public.profiles IS 'Tabela de perfis de usuários - RLS atualizado em 2025-01-07 para corrigir conflitos de políticas e bloquear acesso público';
