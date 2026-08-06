CREATE OR REPLACE FUNCTION public.normalize_phone(_raw text)
RETURNS text
LANGUAGE plpgsql
IMMUTABLE
SET search_path = public
AS $$
DECLARE
  d text;
BEGIN
  IF _raw IS NULL THEN RETURN NULL; END IF;
  d := regexp_replace(_raw, '\D', '', 'g');
  IF d = '' THEN RETURN NULL; END IF;
  IF length(d) BETWEEN 10 AND 11 THEN
    d := '55' || d;
  END IF;
  IF length(d) < 10 OR length(d) > 15 THEN RETURN NULL; END IF;
  RETURN d;
END;
$$;

CREATE OR REPLACE FUNCTION public.ensure_contact_phone()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  jid text;
  local_part text;
  candidate text;
BEGIN
  -- Normaliza telefone informado
  IF NEW.phone IS NOT NULL AND NEW.phone <> '' THEN
    NEW.phone := public.normalize_phone(NEW.phone);
  END IF;

  IF NEW.phone IS NULL OR NEW.phone = '' THEN
    jid := NEW.metadata->>'remoteJid';
    IF jid IS NOT NULL THEN
      local_part := split_part(jid, '@', 1);

      -- 1) JID oficial do WhatsApp com numero
      IF jid LIKE '%@s.whatsapp.net' OR jid LIKE '%@c.us' THEN
        candidate := public.normalize_phone(local_part);
      END IF;

      -- 2) LID -> telefone via mapeamento existente
      IF candidate IS NULL THEN
        SELECT public.normalize_phone(m.phone) INTO candidate
        FROM public.lid_phone_mapping m
        WHERE m.lid = local_part
          AND m.phone IS NOT NULL AND m.phone <> ''
        ORDER BY m.updated_at DESC
        LIMIT 1;
      END IF;

      -- Evita colidir com telefone ja usado por outro contato da mesma empresa
      IF candidate IS NOT NULL AND EXISTS (
        SELECT 1 FROM public.contacts x
        WHERE x.company_id = NEW.company_id
          AND x.phone = candidate
          AND x.id <> NEW.id
      ) THEN
        candidate := NULL;
      END IF;

      NEW.phone := candidate;
    END IF;
  END IF;

  RETURN NEW;
END;
$$;