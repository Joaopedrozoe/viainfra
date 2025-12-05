-- Criar conversa para o contato 3841 com metadata do TESTE2
INSERT INTO conversations (contact_id, channel, status, company_id, metadata)
SELECT 
  'abfcb908-ed93-4615-a488-0704fd62e1ab',
  'whatsapp',
  'open',
  company_id,
  jsonb_build_object(
    'instance_name', 'TESTE2',
    'remoteJid', '5511991593841@s.whatsapp.net'
  )
FROM whatsapp_instances
WHERE instance_name = 'TESTE2'
ON CONFLICT DO NOTHING
RETURNING id;