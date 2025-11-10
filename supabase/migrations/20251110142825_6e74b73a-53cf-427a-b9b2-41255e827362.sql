-- Atualizar o bot flow do WhatsApp para trocar "agendamento" por "incidente"
UPDATE bots 
SET flows = jsonb_set(
  flows,
  '{nodes}',
  (
    SELECT jsonb_agg(
      CASE 
        WHEN node->>'id' = 'chamado-agendamento' THEN
          jsonb_set(
            node, 
            '{data,action}', 
            '"📅 Informe a data e hora do incidente (ex: 25/12/2024 14:30)"'
          )
        ELSE node
      END
    )
    FROM jsonb_array_elements(flows->'nodes') AS node
  )
)
WHERE id = 'bot-whatsapp-viainfra';