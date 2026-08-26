CREATE OR REPLACE FUNCTION public.sanitize_agent_names_text(_t text)
RETURNS text
LANGUAGE sql
IMMUTABLE
SET search_path = public
AS $$
  SELECT CASE WHEN _t IS NULL THEN NULL ELSE
    regexp_replace(
      regexp_replace(
        regexp_replace(
          regexp_replace(_t, 'Eliane\s+Furtado', 'Sandra Romano', 'gi'),
        'Giovanna\s+Ferreira', 'André Rocha', 'gi'),
      'Fl[aá]via(\s+Financeiro)?', 'André Rocha', 'gi'),
    '(\*\*)?Andr[eé](\*\*)?(\s+do setor Financeiro)', '\1André Rocha\2\3', 'gi')
  END
$$;

CREATE OR REPLACE FUNCTION public.sanitize_message_agent_names()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.content := public.sanitize_agent_names_text(NEW.content);
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_sanitize_message_agent_names ON public.messages;
CREATE TRIGGER trg_sanitize_message_agent_names
BEFORE INSERT OR UPDATE OF content ON public.messages
FOR EACH ROW EXECUTE FUNCTION public.sanitize_message_agent_names();

UPDATE public.messages
SET content = public.sanitize_agent_names_text(content)
WHERE content ~* 'Eliane\s+Furtado|Giovanna\s+Ferreira|Fl[aá]via';

UPDATE public.conversations
SET metadata = jsonb_set(metadata, '{atendente}', to_jsonb(public.sanitize_agent_names_text(metadata->>'atendente')))
WHERE metadata->>'atendente' ~* 'Eliane\s+Furtado|Giovanna\s+Ferreira|Fl[aá]via';

UPDATE public.profiles
SET name = public.sanitize_agent_names_text(name)
WHERE name ~* 'Eliane\s+Furtado|Giovanna\s+Ferreira';