
-- Corrigir o remoteJid da conversa do Joao de Lima Junior para formato @lid correto
UPDATE conversations
SET metadata = jsonb_set(
  COALESCE(metadata, '{}'::jsonb),
  '{lidJid}',
  '"cmjbra3gy4b7eo64igjfim8dy@lid"'::jsonb
)
WHERE id = '56e941a9-6101-41fe-87d2-b53a4601d26c';

-- Atualizar o remoteJid também para o formato correto
UPDATE conversations
SET metadata = jsonb_set(
  metadata,
  '{remoteJid}',
  '"cmjbra3gy4b7eo64igjfim8dy@lid"'::jsonb
)
WHERE id = '56e941a9-6101-41fe-87d2-b53a4601d26c';
