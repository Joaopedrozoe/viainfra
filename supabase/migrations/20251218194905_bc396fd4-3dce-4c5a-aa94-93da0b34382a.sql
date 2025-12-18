
-- =====================================================
-- CORREÇÃO COMPLETA DO INBOX - SINCRONIZAÇÃO COM WHATSAPP WEB
-- =====================================================

-- 1. Corrigir João de Lima Junior - phone está com lidJid, deve ser NULL
UPDATE contacts 
SET 
  phone = NULL,
  metadata = jsonb_set(
    jsonb_set(
      COALESCE(metadata, '{}'::jsonb),
      '{lidJid}',
      '"cmjbra3gy4b7eo64igjfim8dy@lid"'
    ),
    '{remoteJid}',
    '"cmjbra3gy4b7eo64igjfim8dy@lid"'
  ),
  updated_at = now()
WHERE id = '86efccaf-0753-4b6e-b8ff-2cd4cb9d6e75';

-- 2. Remover contatos duplicados VIAINFRA-RH (manter apenas 1)
DELETE FROM contacts 
WHERE id IN ('7f692d7e-4927-4178-bfbd-f0d39ddc03bd', '199d8b05-e45d-43ee-918a-ad5206a1a33e');

-- 3. Atualizar timestamp do João para refletir última mensagem (16:27 = 19:27 UTC)
UPDATE conversations 
SET updated_at = '2025-12-18 19:27:17.957134+00'
WHERE id = '56e941a9-6101-41fe-87d2-b53a4601d26c';

-- 4. Atualizar timestamp do Serviços Zigurate para 16:22 (19:22 UTC)
UPDATE conversations 
SET updated_at = '2025-12-18 19:22:00+00'
WHERE id = 'c662a740-fbdd-4a2a-986b-0bf4e0e2a85d';

-- 5. Atualizar timestamp do VIAINFRA-RH para 15:55 (18:55 UTC)
UPDATE conversations 
SET updated_at = '2025-12-18 18:55:00+00'
WHERE id = '14963600-04c5-431f-8cc3-a1d537f6b758';

-- 6. Atualizar timestamp da Giovanna para 15:54 (18:54 UTC)
UPDATE conversations 
SET updated_at = '2025-12-18 18:54:00+00'
WHERE id = 'b5ae0c99-91fb-420b-a687-590dac429766';

-- 7. Atualizar timestamp do Flavio M para 15:52 (18:52 UTC)
UPDATE conversations 
SET updated_at = '2025-12-18 18:52:00+00'
WHERE id = 'c18a76fd-4a13-4436-aeb8-32ab004fc2d5';
