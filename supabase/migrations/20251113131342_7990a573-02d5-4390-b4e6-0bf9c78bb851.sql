-- Corrigir contatos sem telefone extraindo do remoteJid no metadata
UPDATE contacts
SET 
  phone = REGEXP_REPLACE(metadata->>'remoteJid', '@.*', ''),
  updated_at = now()
WHERE (phone IS NULL OR phone = '')
  AND metadata->>'remoteJid' IS NOT NULL
  AND metadata->>'remoteJid' ~ '^\d+@';

-- Criar função para validar e atualizar telefone automaticamente
CREATE OR REPLACE FUNCTION ensure_contact_phone()
RETURNS TRIGGER AS $$
BEGIN
  -- Se phone está vazio mas temos remoteJid com número, extrair
  IF (NEW.phone IS NULL OR NEW.phone = '') AND 
     NEW.metadata ? 'remoteJid' AND 
     NEW.metadata->>'remoteJid' ~ '^\d+@' THEN
    NEW.phone := REGEXP_REPLACE(NEW.metadata->>'remoteJid', '@.*', '');
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Criar trigger para garantir phone sempre preenchido
DROP TRIGGER IF EXISTS ensure_contact_phone_trigger ON contacts;
CREATE TRIGGER ensure_contact_phone_trigger
  BEFORE INSERT OR UPDATE ON contacts
  FOR EACH ROW
  EXECUTE FUNCTION ensure_contact_phone();