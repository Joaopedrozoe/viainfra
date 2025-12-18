
-- Forçar timestamps corretos conforme WhatsApp Web oficial

-- Via & T.Informatica - 16:56 SP = 19:56 UTC
UPDATE conversations SET updated_at = '2025-12-18 19:56:00+00'::timestamptz WHERE id = '18f47bb1-db28-488c-bcbd-a1b50ebd2740';

-- Jairo - 16:55 SP = 19:55 UTC  
UPDATE conversations SET updated_at = '2025-12-18 19:55:30+00'::timestamptz WHERE id = '566d3343-8288-49cc-83e1-03b3c98f9932';

-- Anthony Informatica - 16:36 SP = 19:36 UTC
UPDATE conversations SET updated_at = '2025-12-18 19:36:00+00'::timestamptz WHERE id = '31cbab2d-ecd8-4389-8754-a5e711d4260d';

-- Serviços Zigurate - 16:22 SP = 19:22 UTC
UPDATE conversations SET updated_at = '2025-12-18 19:22:00+00'::timestamptz WHERE id = 'c662a740-fbdd-4a2a-986b-0bf4e0e2a85d';

-- Joao de Lima Junior - 16:21 SP = 19:21 UTC
UPDATE conversations SET updated_at = '2025-12-18 19:21:00+00'::timestamptz WHERE id = 'b2c3d4e5-f6a7-8901-bcde-f12345678901';

-- Flavio Gonçalves - 16:13 SP = 19:13 UTC
UPDATE conversations SET updated_at = '2025-12-18 19:13:00+00'::timestamptz WHERE id = '7d35a181-f1ef-4c50-9ce1-18e1c37170da';

-- Fabrício - 16:05 SP = 19:05 UTC
UPDATE conversations SET updated_at = '2025-12-18 19:05:00+00'::timestamptz WHERE id = '5c15432d-f614-4e1e-b229-7ccc7d61f835';

-- VIAINFRA-RH - 15:55 SP = 18:55 UTC
UPDATE conversations SET updated_at = '2025-12-18 18:55:00+00'::timestamptz WHERE id = '14963600-04c5-431f-8cc3-a1d537f6b758';

-- Giovanna - 15:54 SP = 18:54 UTC
UPDATE conversations SET updated_at = '2025-12-18 18:54:00+00'::timestamptz WHERE id = 'b5ae0c99-91fb-420b-a687-590dac429766';

-- Gerente Claro - Julio Rodrigues - mover para baixo, não está visível no topo da lista
UPDATE conversations SET updated_at = '2025-12-18 18:50:00+00'::timestamptz WHERE id = '10076e35-5184-4008-82e3-d2dd0d30a2f7';

-- Flávia - manter posição atual
UPDATE conversations SET updated_at = '2025-12-18 18:52:00+00'::timestamptz WHERE id = '2fbbe295-6942-4bda-b903-09b06a0fe950';
