-- Create conversations for contacts that have chats but no conversation
-- This includes Flávia and any other contacts imported from "contacts" source that should have conversations

-- Get company_id for VIAINFRA
DO $$
DECLARE 
  v_company_id uuid;
BEGIN
  SELECT id INTO v_company_id FROM companies WHERE name ILIKE '%viainfra%' LIMIT 1;
  
  -- Create conversation for Flávia if not exists
  INSERT INTO conversations (company_id, contact_id, channel, status, metadata)
  SELECT 
    v_company_id,
    c.id,
    'whatsapp',
    'open',
    jsonb_build_object('instanceName', 'VIAINFRAOFICIAL', 'remoteJid', c.metadata->>'remoteJid', 'importedAt', now()::text)
  FROM contacts c
  WHERE c.company_id = v_company_id
    AND c.phone IS NOT NULL
    AND NOT EXISTS (
      SELECT 1 FROM conversations conv 
      WHERE conv.contact_id = c.id 
        AND conv.channel = 'whatsapp'
    )
    AND c.metadata->>'source' LIKE 'whatsapp_import%'
  ON CONFLICT DO NOTHING;
END $$;

-- Also update contact names that are still just phone numbers
-- by looking at their metadata or using proper naming
UPDATE contacts SET name = 'Anthony Informatica' WHERE phone = '5511971088515' AND name = phone;
UPDATE contacts SET name = 'Via & T.Informatica' WHERE phone = '5511940027215' AND name LIKE '%Tothetop%' OR name LIKE '%tothetop%';
UPDATE contacts SET name = 'JC Assessoria Contabil' WHERE phone LIKE '%996598124%' AND name LIKE '%Contabilidade%';