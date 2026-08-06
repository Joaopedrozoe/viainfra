CREATE OR REPLACE FUNCTION public.repair_contact_phones(_company_id uuid DEFAULT NULL::uuid, _dry_run boolean DEFAULT true, _limit integer DEFAULT 5000)
 RETURNS TABLE(contact_id uuid, contact_name text, proposed_phone text, pass text, evidence integer)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  PERFORM public.assert_repair_allowed();

  CREATE TEMP TABLE _targets ON COMMIT DROP AS
  SELECT c.id, c.company_id, c.name, c.metadata
  FROM public.contacts c
  WHERE (c.phone IS NULL OR c.phone = '')
    AND (_company_id IS NULL OR c.company_id = _company_id)
    AND coalesce(c.metadata->>'remoteJid','') NOT LIKE '%@g.us'
    AND coalesce((c.metadata->>'isGroup')::boolean, false) = false
  LIMIT _limit;

  CREATE TEMP TABLE _proposals(
    contact_id uuid,
    contact_name text,
    proposed_phone text,
    pass text,
    evidence integer
  ) ON COMMIT DROP;

  -- Pass 1: cross-match by WhatsApp message id
  INSERT INTO _proposals
  WITH imp AS (
    SELECT t.id AS cid,
           coalesce(m.metadata->>'external_id', m.metadata->>'messageId') AS eid
    FROM _targets t
    JOIN public.conversations v ON v.contact_id = t.id
    JOIN public.messages m ON m.conversation_id = v.id
    WHERE coalesce(m.metadata->>'external_id', m.metadata->>'messageId') IS NOT NULL
  ),
  src AS (
    SELECT coalesce(m.metadata->>'external_id', m.metadata->>'messageId') AS eid,
           ct.phone, ct.company_id
    FROM public.messages m
    JOIN public.conversations v ON v.id = m.conversation_id
    JOIN public.contacts ct ON ct.id = v.contact_id
    WHERE ct.phone IS NOT NULL AND ct.phone <> ''
  ),
  matched AS (
    SELECT imp.cid, src.phone, count(*)::int AS ev
    FROM imp
    JOIN src ON src.eid = imp.eid
    JOIN _targets t ON t.id = imp.cid AND t.company_id = src.company_id
    GROUP BY 1, 2
  ),
  unique_match AS (
    SELECT cid FROM matched GROUP BY cid HAVING count(DISTINCT phone) = 1
  )
  SELECT m.cid, t.name, m.phone, 'message_id_crossmatch', m.ev
  FROM matched m
  JOIN unique_match u ON u.cid = m.cid
  JOIN _targets t ON t.id = m.cid;

  -- Pass 2: JID / LID mapping
  INSERT INTO _proposals
  SELECT t.id, t.name, p.phone, 'jid_or_lid', 1
  FROM _targets t
  CROSS JOIN LATERAL (
    SELECT coalesce(
      CASE
        WHEN t.metadata->>'remoteJid' LIKE '%@s.whatsapp.net'
          OR t.metadata->>'remoteJid' LIKE '%@c.us'
        THEN public.normalize_phone(split_part(t.metadata->>'remoteJid','@',1))
      END,
      (SELECT public.normalize_phone(lm.phone)
         FROM public.lid_phone_mapping lm
        WHERE lm.lid = split_part(coalesce(t.metadata->>'remoteJid',''),'@',1)
          AND lm.phone IS NOT NULL AND lm.phone <> ''
        ORDER BY lm.updated_at DESC LIMIT 1),
      (SELECT public.normalize_phone(split_part(v.metadata->>'remoteJid','@',1))
         FROM public.conversations v
        WHERE v.contact_id = t.id
          AND (v.metadata->>'remoteJid' LIKE '%@s.whatsapp.net' OR v.metadata->>'remoteJid' LIKE '%@c.us')
        LIMIT 1)
    ) AS phone
  ) p
  WHERE p.phone IS NOT NULL
    AND NOT EXISTS (SELECT 1 FROM _proposals x WHERE x.contact_id = t.id);

  -- Pass 3: spreadsheet directory by normalized name (unique match only)
  INSERT INTO _proposals
  WITH dir AS (
    SELECT public.normalize_phone(d.phone) AS phone,
           public.normalize_name(coalesce(d.saved_name, d.display_name)) AS nname
    FROM public.contact_directory d
    WHERE coalesce(d.saved_name, d.display_name) IS NOT NULL
  ),
  dedup AS (
    SELECT nname, min(phone) AS phone, count(DISTINCT phone) AS n
    FROM dir WHERE phone IS NOT NULL AND nname IS NOT NULL
    GROUP BY nname
  )
  SELECT t.id, t.name, dd.phone, 'spreadsheet_name', 1
  FROM _targets t
  JOIN dedup dd ON dd.nname = public.normalize_name(t.name) AND dd.n = 1
  WHERE NOT EXISTS (SELECT 1 FROM _proposals x WHERE x.contact_id = t.id);

  -- Pass 4: waid embedded in vCard / message content
  INSERT INTO _proposals
  WITH waid AS (
    SELECT t.id AS cid,
           public.normalize_phone((regexp_matches(m.content, 'waid=([0-9]{10,15})'))[1]) AS phone
    FROM _targets t
    JOIN public.conversations v ON v.contact_id = t.id
    JOIN public.messages m ON m.conversation_id = v.id
    WHERE m.content ~ 'waid=[0-9]{10,15}'
  ),
  uniq AS (
    SELECT cid, min(phone) AS phone, count(DISTINCT phone) AS n
    FROM waid WHERE phone IS NOT NULL GROUP BY cid
  )
  SELECT t.id, t.name, u.phone, 'vcard_waid', 1
  FROM uniq u
  JOIN _targets t ON t.id = u.cid
  WHERE u.n = 1
    AND NOT EXISTS (SELECT 1 FROM _proposals x WHERE x.contact_id = t.id);

  -- Remove proposals that would collide with an existing contact phone in the same company
  DELETE FROM _proposals p
  USING _targets t
  WHERE p.contact_id = t.id
    AND EXISTS (
      SELECT 1 FROM public.contacts c2
      WHERE c2.company_id = t.company_id
        AND c2.phone = p.proposed_phone
        AND c2.id <> p.contact_id
    );

  -- Keep a single proposal per contact and per (company, phone)
  DELETE FROM _proposals a USING _proposals b
  WHERE a.contact_id = b.contact_id AND a.ctid > b.ctid;

  DELETE FROM _proposals a
  USING _proposals b, _targets ta, _targets tb
  WHERE ta.id = a.contact_id AND tb.id = b.contact_id
    AND ta.company_id = tb.company_id
    AND a.proposed_phone = b.proposed_phone
    AND a.ctid > b.ctid;

  IF NOT _dry_run THEN
    UPDATE public.contacts c
    SET phone = p.proposed_phone,
        metadata = coalesce(c.metadata,'{}'::jsonb)
                   || jsonb_build_object('phoneRecoveredBy', p.pass, 'phoneRecoveredAt', now()),
        updated_at = now()
    FROM _proposals p
    WHERE c.id = p.contact_id
      AND (c.phone IS NULL OR c.phone = '');
  END IF;

  RETURN QUERY SELECT p.contact_id, p.contact_name, p.proposed_phone, p.pass, p.evidence
  FROM _proposals p ORDER BY p.pass, p.contact_name;
END;
$function$;