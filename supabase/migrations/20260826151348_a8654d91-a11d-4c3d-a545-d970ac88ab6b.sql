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
            regexp_replace(
              regexp_replace(_t,
                'Eliane\s+Furtado', 'Sandra Romano', 'gi'),
              'Giovanna\s+Ferreira', 'André Rocha', 'gi'),
            'Fl[aá]via(?:\s+Financeiro)?', 'André Rocha', 'gi'),
          'Andr[eé](?:\s+Rocha)+', 'André Rocha', 'gi'),
        '(atendido por\s+)(\*\*)?Andr[eé](\*\*)?(\s+do setor Financeiro)',
        '\1\2André Rocha\3\4', 'gi'),
      '(você está sendo atendido por\s+)(\*\*)?Andr[eé](\*\*)?(\.|\s)',
      '\1\2André Rocha\3\4', 'gi')
  END
$$;

REVOKE ALL ON FUNCTION public.sanitize_agent_names_text(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.sanitize_agent_names_text(text) TO service_role;

CREATE UNIQUE INDEX IF NOT EXISTS messages_unique_web_bot_request
ON public.messages (conversation_id, ((metadata->>'request_id')))
WHERE sender_type = 'bot'
  AND metadata->>'request_id' IS NOT NULL;