-- =====================================================
-- LIMPEZA: Regra Mestra de Isolamento de Instâncias
-- =====================================================

-- 1. Desassociar instâncias externas da empresa VIAINFRA
-- Isso impede qualquer processo automático de vincular dados dessas instâncias à VIAINFRA
UPDATE whatsapp_instances 
SET company_id = NULL 
WHERE instance_name IN ('LEGACYTATTOO', 'LEGACYTATTOO_TEST', 'JUNIOCORRETOR_ALUGUEL', 'JUNIOCORRETOR_VENDAS', 'Via Infra ')
AND company_id = 'da17735c-5a76-4797-b338-f6e63a7b3f8b';

-- 2. Deletar mensagens das conversas sujas (devem ser deletadas ANTES das conversas por FK)
DELETE FROM messages 
WHERE conversation_id IN (
  SELECT id FROM conversations 
  WHERE company_id = 'da17735c-5a76-4797-b338-f6e63a7b3f8b' 
  AND (
    metadata->>'instanceName' ILIKE '%LEGACYTATTOO%' 
    OR metadata->>'instanceName' ILIKE '%JUNIOCORRETOR%'
    OR metadata->>'instanceName' ILIKE '%JUNIORCORRETOR%'
  )
);

-- 3. Deletar as conversas sujas que pertencem a instâncias externas
DELETE FROM conversations 
WHERE company_id = 'da17735c-5a76-4797-b338-f6e63a7b3f8b' 
AND (
  metadata->>'instanceName' ILIKE '%LEGACYTATTOO%' 
  OR metadata->>'instanceName' ILIKE '%JUNIOCORRETOR%'
  OR metadata->>'instanceName' ILIKE '%JUNIORCORRETOR%'
);