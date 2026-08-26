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
          regexp_replace(
            regexp_replace(_t, 'Eliane\s+Furtado', 'Sandra Romano', 'gi'),
          'Giovanna\s+Ferreira', 'André Rocha', 'gi'),
        'Fl[aá]via(\s+Financeiro)?', 'André Rocha', 'gi'),
      '(\*\*)?Andr[eé](\*\*)?(\s+do setor Financeiro)', '\1André Rocha\2\3', 'gi'),
    '(atendido por\s+)(\*\*)?Andr[eé](\*\*)?', '\1\2André Rocha\3', 'gi')
  END
$$;

UPDATE public.messages
SET content = public.sanitize_agent_names_text(content)
WHERE content ~* 'Andr[eé](\*\*)?(\s+do setor Financeiro)|atendido por\s+(\*\*)?Andr[eé]'
  AND content NOT ILIKE '%André Rocha%';