-- Atualizar o nó de transferência para atendente para não mostrar mensagem interna
UPDATE bots
SET flows = jsonb_set(
  flows,
  '{nodes}',
  (
    SELECT jsonb_agg(
      CASE
        WHEN node->>'id' = 'atendente-inicio' THEN
          jsonb_set(
            node,
            '{data,action}',
            '""'
          )
        ELSE node
      END
    )
    FROM jsonb_array_elements(flows->'nodes') AS node
  )
)
WHERE id = 'bot-whatsapp-viainfra';