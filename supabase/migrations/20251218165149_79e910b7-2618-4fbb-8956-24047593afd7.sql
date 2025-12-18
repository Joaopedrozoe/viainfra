
-- Create missing conversations for contacts visible in WhatsApp Web
INSERT INTO conversations (company_id, contact_id, channel, status)
SELECT 
  'da17735c-5a76-4797-b338-f6e63a7b3f8b',
  c.id,
  'whatsapp',
  'open'
FROM contacts c
WHERE c.company_id = 'da17735c-5a76-4797-b338-f6e63a7b3f8b'
AND c.phone IS NOT NULL
AND NOT EXISTS(
  SELECT 1 FROM conversations conv 
  WHERE conv.contact_id = c.id 
  AND conv.channel = 'whatsapp'
)
AND (
  c.name ILIKE '%Suelem%' OR
  c.name ILIKE '%Diego%' OR
  c.name ILIKE '%MPR%' OR
  c.name ILIKE '%Jaquisson%' OR
  c.name ILIKE '%Savio%' OR
  c.name ILIKE '%Cumbica%' OR
  c.name ILIKE '%Sodircan%' OR
  c.name ILIKE '%Gerente Claro%' OR
  c.name ILIKE '%Astra%' OR
  c.name ILIKE '%Robinho%' OR
  c.name ILIKE '%Karlla%' OR
  c.name ILIKE '%Jairo Encarregado%' OR
  c.name ILIKE '%Daniele%Vivo%'
);

-- Fix remaining numeric contact names based on known mappings
-- These numbers were identified but couldn't be automatically resolved
UPDATE contacts SET name = 'Tork Tacógrafos' WHERE phone = '551120854990' AND company_id = 'da17735c-5a76-4797-b338-f6e63a7b3f8b' AND name = '551120854990';
UPDATE contacts SET name = 'Loja SP' WHERE phone = '551128386942' AND company_id = 'da17735c-5a76-4797-b338-f6e63a7b3f8b' AND name = '551128386942';
UPDATE contacts SET name = 'Serviço SP' WHERE phone = '551140041144' AND company_id = 'da17735c-5a76-4797-b338-f6e63a7b3f8b' AND name = '551140041144';
