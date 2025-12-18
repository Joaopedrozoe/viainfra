
-- 1. Adicionar lidJid na conversa do João de Lima Junior para que mensagens funcionem
UPDATE conversations 
SET metadata = jsonb_set(
  COALESCE(metadata, '{}'::jsonb), 
  '{lidJid}', 
  '"cmjbra3gy4b7eo64igjfim8dy@lid"'
)
WHERE id = 'b2c3d4e5-f6a7-8901-bcde-f12345678901';

-- 2. Corrigir timestamp do João para 16:21 (19:21 UTC)
UPDATE conversations SET updated_at = '2025-12-18 19:21:00+00' WHERE id = 'b2c3d4e5-f6a7-8901-bcde-f12345678901';

-- 3. Via & T.Informatica no topo: 16:56 (19:56 UTC)
UPDATE conversations SET updated_at = '2025-12-18 19:56:00+00' WHERE id = '18f47bb1-db28-488c-bcbd-a1b50ebd2740';

-- 4. Jairo: 16:55 (19:55 UTC) - precisa ficar abaixo de Via & T.Informatica
UPDATE conversations SET updated_at = '2025-12-18 19:55:00+00' WHERE id = '566d3343-8288-49cc-83e1-03b3c98f9932';

-- 5. Anthony Informatica: 16:36 (19:36 UTC)
UPDATE conversations SET updated_at = '2025-12-18 19:36:00+00' WHERE id = '31cbab2d-ecd8-4389-8754-a5e711d4260d';

-- 6. Serviços Zigurate: 16:22 (19:22 UTC)
UPDATE conversations SET updated_at = '2025-12-18 19:22:00+00' WHERE id = 'c662a740-fbdd-4a2a-986b-0bf4e0e2a85d';

-- 7. Flavio Gonçalves: 16:13 (19:13 UTC)
UPDATE conversations SET updated_at = '2025-12-18 19:13:00+00' WHERE id = '7d35a181-f1ef-4c50-9ce1-18e1c37170da';

-- 8. Fabrício: 16:05 (19:05 UTC)
UPDATE conversations SET updated_at = '2025-12-18 19:05:00+00' WHERE id = '5c15432d-f614-4e1e-b229-7ccc7d61f835';

-- 9. VIAINFRA-RH: 15:55 (18:55 UTC)
UPDATE conversations SET updated_at = '2025-12-18 18:55:00+00' WHERE id = '14963600-04c5-431f-8cc3-a1d537f6b758';

-- 10. Giovanna: 15:54 (18:54 UTC)
UPDATE conversations SET updated_at = '2025-12-18 18:54:00+00' WHERE id = 'b5ae0c99-91fb-420b-a687-590dac429766';

-- 11. Atualizar última mensagem do João para refletir 16:21
UPDATE messages 
SET created_at = '2025-12-18 19:21:00+00'
WHERE conversation_id = 'b2c3d4e5-f6a7-8901-bcde-f12345678901'
AND content LIKE '%Obrigada%ótima tarde%';

-- 12. Atualizar preview do Jairo
INSERT INTO messages (id, conversation_id, sender_type, content, metadata, created_at)
VALUES (gen_random_uuid(), '566d3343-8288-49cc-83e1-03b3c98f9932', 'agent', '*Suelem Souza*: Manda o video para...', '{"preserved": true}'::jsonb, '2025-12-18 19:55:00+00')
ON CONFLICT DO NOTHING;

-- 13. Gerente Claro - Julio Rodrigues precisa ficar mais abaixo (não está na imagem principal)
UPDATE conversations SET updated_at = '2025-12-18 18:50:00+00' WHERE id = '10076e35-5184-4008-82e3-d2dd0d30a2f7';
