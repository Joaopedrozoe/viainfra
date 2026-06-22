CREATE OR REPLACE FUNCTION public.get_inbox_previews(_company_id uuid, _limit int DEFAULT 200)
RETURNS TABLE(
  conversation_id uuid,
  message_id uuid,
  content text,
  sender_type text,
  created_at timestamptz,
  rn int
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Autorização: usuário precisa ter acesso a essa empresa (profile ou company_access)
  IF NOT (
    EXISTS (SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND company_id = _company_id)
    OR EXISTS (SELECT 1 FROM public.company_access WHERE user_id = auth.uid() AND company_id = _company_id)
  ) THEN
    RAISE EXCEPTION 'Access denied';
  END IF;

  RETURN QUERY
  WITH convs AS (
    SELECT c.id
    FROM public.conversations c
    WHERE c.company_id = _company_id
      AND (c.metadata->>'remoteJid' IS NULL OR c.metadata->>'remoteJid' <> 'status@broadcast')
    ORDER BY c.updated_at DESC
    LIMIT _limit
  ),
  ranked AS (
    SELECT m.conversation_id,
           m.id,
           m.content,
           m.sender_type,
           m.created_at,
           row_number() OVER (PARTITION BY m.conversation_id ORDER BY m.created_at DESC)::int AS rn
    FROM public.messages m
    WHERE m.conversation_id IN (SELECT id FROM convs)
  )
  SELECT r.conversation_id, r.id, r.content, r.sender_type, r.created_at, r.rn
  FROM ranked r
  WHERE r.rn <= 5;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_inbox_previews(uuid, int) TO authenticated, service_role;