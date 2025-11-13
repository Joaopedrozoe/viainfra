-- Atualizar função para NUNCA extrair telefone de @lid
CREATE OR REPLACE FUNCTION ensure_contact_phone()
RETURNS TRIGGER AS $$
BEGIN
  -- Se phone está vazio mas temos remoteJid com número válido (NÃO @lid), extrair
  IF (NEW.phone IS NULL OR NEW.phone = '') AND 
     NEW.metadata ? 'remoteJid' AND 
     NEW.metadata->>'remoteJid' ~ '^\d+@' AND
     NEW.metadata->>'remoteJid' NOT LIKE '%@lid%' THEN
    
    -- Extrair apenas se for formato válido do WhatsApp
    IF NEW.metadata->>'remoteJid' LIKE '%@s.whatsapp.net%' OR 
       NEW.metadata->>'remoteJid' LIKE '%@c.us%' THEN
      NEW.phone := REGEXP_REPLACE(NEW.metadata->>'remoteJid', '@.*', '');
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Limpar telefones inválidos que vieram de @lid
UPDATE contacts
SET phone = NULL, updated_at = now()
WHERE phone IS NOT NULL 
  AND phone != ''
  AND NOT (phone ~ '^55\d{10,11}$')
  AND metadata->>'remoteJid' LIKE '%@lid%';