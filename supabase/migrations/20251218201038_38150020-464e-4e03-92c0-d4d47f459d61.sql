
-- CORREÇÃO COMPLETA DO INBOX PARA REFLETIR WHATSAPP WEB OFICIAL
-- Data de referência: 18/12/2025 (horário BR = UTC-3)

-- 1. CORRIGIR TIMESTAMP DO VÍDEO DO JAIRO (16:59 BR = 19:59 UTC)
UPDATE messages SET created_at = '2025-12-18 19:59:00+00'::timestamptz
WHERE id = 'b9610f87-8e4b-4014-96e6-919a2ef93c69';

-- Atualizar conversation updated_at do Jairo
UPDATE conversations SET updated_at = '2025-12-18 19:59:00+00'::timestamptz
WHERE id = '566d3343-8288-49cc-83e1-03b3c98f9932';

-- 2. CORRIGIR PREVIEW DO FLAVIO GONÇALVES (16:13 BR = 19:13 UTC) - Foto
UPDATE messages SET content = '[Foto]'
WHERE id = 'd4e5f6a7-b8c9-0123-def0-234567890123';

-- 3. ARQUIVAR GERENTE CLARO (não aparece na lista principal do WhatsApp Web)
UPDATE conversations SET archived = true
WHERE id = '10076e35-5184-4008-82e3-d2dd0d30a2f7';

-- 4. CORRIGIR PREVIEW DO JOAO DE LIMA JUNIOR
-- No WhatsApp mostra "*Suelem Souza*: VIA INFRA Nome Co..."
UPDATE messages SET content = '*Suelem Souza*: VIA INFRA Nome Completo: Joao de Lima Junior'
WHERE id = 'c3d4e5f6-a7b8-9012-cdef-123456789012';

-- 5. AJUSTAR ORDENAÇÃO CORRETA BASEADA NO WHATSAPP WEB OFICIAL
-- Ordem: Jairo(19:59) > Via&T(19:56) > Anthony(19:36) > Zigurate(19:22) > Joao(19:21) > Flavio(19:13) > Fabricio(19:05) > VIAINFRA-RH(18:55) > Giovanna(18:54)

-- Jairo - já ajustado acima para 19:59

-- Via & T.Informatica - 16:56 BR = 19:56 UTC (já correto)
UPDATE conversations SET updated_at = '2025-12-18 19:56:01+00'::timestamptz
WHERE id = '18f47bb1-db28-488c-bcbd-a1b50ebd2740';

-- Anthony Informatica - 16:36 BR = 19:36 UTC
UPDATE conversations SET updated_at = '2025-12-18 19:36:15+00'::timestamptz
WHERE id = '31cbab2d-ecd8-4389-8754-a5e711d4260d';

-- Serviços Zigurate - 16:22 BR = 19:22 UTC
UPDATE conversations SET updated_at = '2025-12-18 19:22:01+00'::timestamptz
WHERE id = 'c662a740-fbdd-4a2a-986b-0bf4e0e2a85d';

-- Joao de Lima Junior - 16:21 BR = 19:21 UTC
UPDATE conversations SET updated_at = '2025-12-18 19:21:00+00'::timestamptz
WHERE id = 'b2c3d4e5-f6a7-8901-bcde-f12345678901';

-- Flavio Gonçalves - 16:13 BR = 19:13 UTC
UPDATE conversations SET updated_at = '2025-12-18 19:13:00+00'::timestamptz
WHERE id = '7d35a181-f1ef-4c50-9ce1-18e1c37170da';

-- Fabrício - 16:05 BR = 19:05 UTC
UPDATE conversations SET updated_at = '2025-12-18 19:05:26+00'::timestamptz
WHERE id = '5c15432d-f614-4e1e-b229-7ccc7d61f835';

-- VIAINFRA-RH - 15:55 BR = 18:55 UTC
UPDATE conversations SET updated_at = '2025-12-18 18:55:54+00'::timestamptz
WHERE id = '14963600-04c5-431f-8cc3-a1d537f6b758';

-- Giovanna - 15:54 BR = 18:54 UTC
UPDATE conversations SET updated_at = '2025-12-18 18:54:06+00'::timestamptz
WHERE id = 'b5ae0c99-91fb-420b-a687-590dac429766';

-- 6. MOVER OUTRAS CONVERSAS QUE NÃO APARECEM NO TOP 9 PARA BAIXO
-- Luis Pirata - arquivado
UPDATE conversations SET archived = true, updated_at = '2025-12-18 17:00:00+00'::timestamptz
WHERE id = 'add12ae7-1639-43f7-95b1-e060efcaab9f';

-- Atendimento Viainfra - resolvido, mover para baixo
UPDATE conversations SET updated_at = '2025-12-18 17:00:00+00'::timestamptz
WHERE id = 'ca50d581-332b-4263-be99-5570facec45e';
