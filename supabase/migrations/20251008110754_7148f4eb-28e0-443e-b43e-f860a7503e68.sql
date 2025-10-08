-- ========================================
-- CORREÇÃO URGENTE: Reverter políticas muito restritivas  
-- Permitir login funcionar corretamente
-- ========================================

-- Remover TODAS as políticas existentes para reconstruir
DROP POLICY IF EXISTS "Profiles: Deny all anonymous access" ON public.profiles;
DROP POLICY IF EXISTS "Profiles: Require authenticated role" ON public.profiles;
DROP POLICY IF EXISTS "Profiles: View own profile" ON public.profiles;
DROP POLICY IF EXISTS "Profiles: View company colleagues" ON public.profiles;
DROP POLICY IF EXISTS "Profiles: Update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can view profiles from their company" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;

DROP POLICY IF EXISTS "Contacts: Deny all anonymous access" ON public.contacts;
DROP POLICY IF EXISTS "Contacts: Require authenticated role" ON public.contacts;
DROP POLICY IF EXISTS "Authenticated users can view company contacts" ON public.contacts;
DROP POLICY IF EXISTS "Authenticated users can manage company contacts" ON public.contacts;
DROP POLICY IF EXISTS "Allow public web bot to create contacts" ON public.contacts;
DROP POLICY IF EXISTS "Users can view contacts from their company" ON public.contacts;
DROP POLICY IF EXISTS "Users can insert contacts to their company" ON public.contacts;
DROP POLICY IF EXISTS "Users can update contacts from their company" ON public.contacts;
DROP POLICY IF EXISTS "Users can delete contacts from their company" ON public.contacts;

-- PROFILES: Políticas simples e funcionais
CREATE POLICY "Users can view their own profile"
ON public.profiles
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Users can view profiles from their company"
ON public.profiles
FOR SELECT
TO authenticated
USING (company_id = get_user_company_id(auth.uid()));

CREATE POLICY "Users can update their own profile"
ON public.profiles
FOR UPDATE
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- CONTACTS: Políticas funcionais
CREATE POLICY "Users can view contacts from their company"
ON public.contacts
FOR SELECT
TO authenticated
USING (company_id = get_user_company_id(auth.uid()));

CREATE POLICY "Users can insert contacts to their company"
ON public.contacts
FOR INSERT
TO authenticated
WITH CHECK (company_id = get_user_company_id(auth.uid()));

CREATE POLICY "Users can update contacts from their company"
ON public.contacts
FOR UPDATE
TO authenticated
USING (company_id = get_user_company_id(auth.uid()))
WITH CHECK (company_id = get_user_company_id(auth.uid()));

CREATE POLICY "Users can delete contacts from their company"
ON public.contacts
FOR DELETE
TO authenticated
USING (company_id = get_user_company_id(auth.uid()));

-- Permitir widget criar contatos
CREATE POLICY "Allow public web bot to create contacts"
ON public.contacts
FOR INSERT
TO anon
WITH CHECK (company_id IS NOT NULL);