CREATE OR REPLACE FUNCTION public.sanitize_message_agent_names()
RETURNS trigger
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
BEGIN
  NEW.content := public.sanitize_agent_names_text(NEW.content);
  RETURN NEW;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.sanitize_message_agent_names() FROM anon, authenticated;