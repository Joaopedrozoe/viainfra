-- ========================================
-- CORREÇÃO CRÍTICA DE SEGURANÇA
-- Bloquear acesso público a todas as tabelas sensíveis
-- ========================================

-- 1. PROFILES - Informações de funcionários
CREATE POLICY "Deny public access to profiles"
ON public.profiles
AS RESTRICTIVE
FOR SELECT
TO anon
USING (false);

-- 2. CONTACTS - Informações de clientes
CREATE POLICY "Deny public access to contacts"
ON public.contacts
AS RESTRICTIVE
FOR SELECT
TO anon
USING (false);

-- 3. COMPANIES - Configurações da empresa
CREATE POLICY "Deny public access to companies"
ON public.companies
AS RESTRICTIVE
FOR SELECT
TO anon
USING (false);

-- 4. CONVERSATIONS - Metadados de conversas
CREATE POLICY "Deny public access to conversations"
ON public.conversations
AS RESTRICTIVE
FOR SELECT
TO anon
USING (false);

-- 5. INTERNAL_MESSAGES - Mensagens internas da equipe
CREATE POLICY "Deny public access to internal_messages"
ON public.internal_messages
AS RESTRICTIVE
FOR SELECT
TO anon
USING (false);

-- 6. INTERNAL_CONVERSATIONS - Conversas internas da equipe
CREATE POLICY "Deny public access to internal_conversations"
ON public.internal_conversations
AS RESTRICTIVE
FOR SELECT
TO anon
USING (false);

-- 7. CHAMADOS - Tickets de serviço
CREATE POLICY "Deny public access to chamados"
ON public.chamados
AS RESTRICTIVE
FOR SELECT
TO anon
USING (false);

-- 8. AGENTS - Configurações de agentes AI
CREATE POLICY "Deny public access to agents"
ON public.agents
AS RESTRICTIVE
FOR SELECT
TO anon
USING (false);

-- 9. USER_PRESENCE - Presença e status de usuários
CREATE POLICY "Deny public access to user_presence"
ON public.user_presence
AS RESTRICTIVE
FOR SELECT
TO anon
USING (false);

-- Nota: A tabela MESSAGES mantém a política existente para web widget
-- mas está protegida por restrições de tempo (24h) e status (open)