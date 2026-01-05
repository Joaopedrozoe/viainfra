
-- Criar conversa para o contato André Frota (+55 11 99254-2914)
-- Contato: 76606212-5aed-474e-85d9-ed65514e11c9
-- Empresa: da17735c-5a76-4797-b338-f6e63a7b3f8b

INSERT INTO conversations (
  contact_id,
  company_id,
  channel,
  status,
  metadata
)
SELECT 
  '76606212-5aed-474e-85d9-ed65514e11c9',
  'da17735c-5a76-4797-b338-f6e63a7b3f8b',
  'whatsapp',
  'open',
  jsonb_build_object(
    'remoteJid', '5511992542914@s.whatsapp.net',
    'instanceName', 'VIAINFRAOFICIAL'
  )
WHERE NOT EXISTS (
  SELECT 1 FROM conversations WHERE contact_id = '76606212-5aed-474e-85d9-ed65514e11c9'
);
