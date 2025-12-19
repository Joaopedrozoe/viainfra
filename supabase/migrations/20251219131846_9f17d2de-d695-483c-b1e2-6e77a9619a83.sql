
-- Corrigir updated_at de TODAS as conversas WhatsApp baseado na última mensagem
UPDATE conversations c
SET updated_at = subquery.last_msg_time
FROM (
  SELECT 
    conversation_id,
    MAX(created_at) as last_msg_time
  FROM messages
  GROUP BY conversation_id
) as subquery
WHERE c.id = subquery.conversation_id
AND c.channel = 'whatsapp'
AND subquery.last_msg_time IS NOT NULL;

-- Verificar se as conversas da imagem estão corretas
-- Giovanna (09:41 BRT = 12:41 UTC)
-- E A Claro (09:39 BRT = 12:39 UTC)
-- Via & T.Informatica (09:34 BRT = 12:34 UTC)
-- Juscilana (09:33 BRT = 12:33 UTC)
-- Joao de Lima Junior (09:25 BRT = 12:25 UTC)
-- Jaquisson (09:07 BRT = 12:07 UTC)
-- Francisco (09:03 BRT = 12:03 UTC)
-- Fabrício (07:24 BRT = 10:24 UTC)
