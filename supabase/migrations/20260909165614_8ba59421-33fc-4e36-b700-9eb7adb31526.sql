CREATE OR REPLACE FUNCTION public.get_inbox_previews_compact(_company_id uuid, _limit int DEFAULT 1000)
RETURNS TABLE(
  conversation_id uuid,
  last_message_id uuid,
  last_content text,
  last_sender_type text,
  last_created_at timestamptz,
  real_message_id uuid,
  real_content text,
  real_sender_type text,
  real_created_at timestamptz
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
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
  )
  SELECT
    cv.id,
    lm.id, lm.content, lm.sender_type, lm.created_at,
    lr.id, lr.content, lr.sender_type, lr.created_at
  FROM convs cv
  LEFT JOIN LATERAL (
    SELECT m.id, m.content, m.sender_type, m.created_at
    FROM public.messages m
    WHERE m.conversation_id = cv.id
    ORDER BY m.created_at DESC
    LIMIT 1
  ) lm ON true
  LEFT JOIN LATERAL (
    SELECT m.id, m.content, m.sender_type, m.created_at
    FROM public.messages m
    WHERE m.conversation_id = cv.id
      AND COALESCE(m.content, '') !~ '^(\*[^*]+\*:\s*)?Reagiu'
    ORDER BY m.created_at DESC
    LIMIT 1
  ) lr ON true;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_inbox_previews_compact(uuid, int) TO authenticated, service_role;