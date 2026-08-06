-- Helper: normalize names for matching (lowercase, no accents, no punctuation)
CREATE OR REPLACE FUNCTION public.normalize_name(_raw text)
RETURNS text
LANGUAGE sql
IMMUTABLE
SET search_path = public
AS $$
  SELECT nullif(
    btrim(
      regexp_replace(
        lower(translate(coalesce(_raw,''),
          'ÁÀÃÂÄÉÈÊËÍÌÎÏÓÒÕÔÖÚÙÛÜÇÑáàãâäéèêëíìîïóòõôöúùûüçñ',
          'AAAAAEEEEIIIIOOOOOUUUUCNaaaaaeeeeiiiiooooouuuucn')),
        '[^a-z0-9 ]', ' ', 'g'),
      ' '),
    '');
$$;

CREATE INDEX IF NOT EXISTS contacts_norm_name_idx ON public.contacts (public.normalize_name(name));
CREATE INDEX IF NOT EXISTS messages_external_id_idx ON public.messages ((metadata->>'external_id'));
CREATE INDEX IF NOT EXISTS messages_message_id_idx ON public.messages ((metadata->>'messageId'));

-- Guard helper
CREATE OR REPLACE FUNCTION public.assert_repair_allowed()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NOT NULL AND NOT public.is_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Access denied';
  END IF;
END;
$$;

-- 1) Recover phones
CREATE OR REPLACE FUNCTION public.repair_contact_phones(
  _company_id uuid DEFAULT NULL,
  _dry_run boolean DEFAULT true,
  _limit integer DEFAULT 5000
)
RETURNS TABLE(contact_id uuid, contact_name text, proposed_phone text, pass text, evidence integer)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
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
$$;

-- 2) Fix numeric names
CREATE OR REPLACE FUNCTION public.repair_contact_names(
  _company_id uuid DEFAULT NULL,
  _dry_run boolean DEFAULT true,
  _limit integer DEFAULT 5000
)
RETURNS TABLE(contact_id uuid, old_name text, new_name text, source text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  PERFORM public.assert_repair_allowed();

  CREATE TEMP TABLE _ntargets ON COMMIT DROP AS
  SELECT c.id, c.company_id, c.name, c.phone
  FROM public.contacts c
  WHERE (_company_id IS NULL OR c.company_id = _company_id)
    AND c.name ~ '^[+0-9 ()\-]+$'
  LIMIT _limit;

  CREATE TEMP TABLE _nprops(contact_id uuid, old_name text, new_name text, source text) ON COMMIT DROP;

  -- From spreadsheet directory (by phone)
  INSERT INTO _nprops
  SELECT t.id, t.name, btrim(coalesce(d.saved_name, d.display_name)), 'spreadsheet'
  FROM _ntargets t
  JOIN public.contact_directory d ON public.normalize_phone(d.phone) = public.normalize_phone(t.phone)
  WHERE coalesce(d.saved_name, d.display_name) IS NOT NULL
    AND public.normalize_name(coalesce(d.saved_name, d.display_name)) IS NOT NULL
    AND coalesce(d.saved_name, d.display_name) !~ '^[+0-9 ()\-]+$';

  DELETE FROM _nprops a USING _nprops b
  WHERE a.contact_id = b.contact_id AND a.ctid > b.ctid;

  -- From pushName / sender_name captured in inbound messages
  INSERT INTO _nprops
  SELECT DISTINCT ON (t.id) t.id, t.name, btrim(nm.candidate), 'message_pushname'
  FROM _ntargets t
  JOIN public.conversations v ON v.contact_id = t.id
  JOIN public.messages m ON m.conversation_id = v.id
  CROSS JOIN LATERAL (
    SELECT coalesce(m.metadata->>'pushName', m.metadata->>'sender_name') AS candidate
  ) nm
  WHERE m.sender_type = 'user'
    AND nm.candidate IS NOT NULL
    AND btrim(nm.candidate) <> ''
    AND nm.candidate !~ '^[+0-9 ()\-]+$'
    AND NOT EXISTS (SELECT 1 FROM _nprops x WHERE x.contact_id = t.id)
  ORDER BY t.id, m.created_at DESC;

  IF NOT _dry_run THEN
    UPDATE public.contacts c
    SET name = p.new_name,
        metadata = coalesce(c.metadata,'{}'::jsonb)
                   || jsonb_build_object('nameRecoveredBy', p.source, 'nameRecoveredAt', now(), 'previousName', p.old_name),
        updated_at = now()
    FROM _nprops p
    WHERE c.id = p.contact_id;
  END IF;

  RETURN QUERY SELECT p.contact_id, p.old_name, p.new_name, p.source FROM _nprops p ORDER BY p.source, p.new_name;
END;
$$;

-- 3) Merge duplicate contacts sharing the same phone in a company
CREATE OR REPLACE FUNCTION public.merge_duplicate_contacts(
  _company_id uuid DEFAULT NULL,
  _dry_run boolean DEFAULT true
)
RETURNS TABLE(keep_id uuid, keep_name text, drop_id uuid, drop_name text, phone text, moved_messages integer, removed_duplicates integer)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  r record;
  v_keep_conv uuid;
  v_moved integer;
  v_removed integer;
BEGIN
  PERFORM public.assert_repair_allowed();

  CREATE TEMP TABLE _mres(keep_id uuid, keep_name text, drop_id uuid, drop_name text, phone text,
                          moved_messages integer, removed_duplicates integer) ON COMMIT DROP;

  FOR r IN
    WITH ranked AS (
      SELECT c.id, c.company_id, c.name, c.phone,
             (SELECT count(*) FROM public.messages m
                JOIN public.conversations v ON v.id = m.conversation_id
               WHERE v.contact_id = c.id) AS msgs,
             (c.name ~ '^[+0-9 ()\-]+$') AS numeric_name
      FROM public.contacts c
      WHERE c.phone IS NOT NULL AND c.phone <> ''
        AND (_company_id IS NULL OR c.company_id = _company_id)
    ),
    grp AS (
      SELECT company_id, phone, count(*) AS n FROM ranked GROUP BY 1,2 HAVING count(*) > 1
    ),
    ordered AS (
      SELECT rk.*, row_number() OVER (
        PARTITION BY rk.company_id, rk.phone
        ORDER BY rk.numeric_name ASC, rk.msgs DESC, rk.id ASC) AS rn
      FROM ranked rk JOIN grp ON grp.company_id = rk.company_id AND grp.phone = rk.phone
    )
    SELECT k.id AS keep_id, k.name AS keep_name, d.id AS drop_id, d.name AS drop_name, k.phone
    FROM ordered k
    JOIN ordered d ON d.company_id = k.company_id AND d.phone = k.phone AND d.rn > 1
    WHERE k.rn = 1
  LOOP
    v_moved := 0;
    v_removed := 0;

    IF NOT _dry_run THEN
      SELECT v.id INTO v_keep_conv
      FROM public.conversations v
      WHERE v.contact_id = r.keep_id AND v.channel = 'whatsapp'
      ORDER BY (SELECT count(*) FROM public.messages m WHERE m.conversation_id = v.id) DESC
      LIMIT 1;

      IF v_keep_conv IS NULL THEN
        UPDATE public.conversations SET contact_id = r.keep_id WHERE contact_id = r.drop_id;
      ELSE
        -- remove duplicated messages (same WhatsApp id already present in target)
        WITH dups AS (
          DELETE FROM public.messages m
          USING public.conversations v
          WHERE m.conversation_id = v.id
            AND v.contact_id = r.drop_id
            AND coalesce(m.metadata->>'external_id', m.metadata->>'messageId') IS NOT NULL
            AND EXISTS (
              SELECT 1 FROM public.messages k
              WHERE k.conversation_id = v_keep_conv
                AND coalesce(k.metadata->>'external_id', k.metadata->>'messageId')
                    = coalesce(m.metadata->>'external_id', m.metadata->>'messageId')
            )
          RETURNING 1
        ) SELECT count(*)::int INTO v_removed FROM dups;

        WITH moved AS (
          UPDATE public.messages m
          SET conversation_id = v_keep_conv
          WHERE m.conversation_id IN (
            SELECT v.id FROM public.conversations v WHERE v.contact_id = r.drop_id
          )
          RETURNING 1
        ) SELECT count(*)::int INTO v_moved FROM moved;

        DELETE FROM public.conversations WHERE contact_id = r.drop_id;
      END IF;

      UPDATE public.contacts SET contact_id_placeholder = NULL WHERE false; -- no-op guard
      DELETE FROM public.contacts WHERE id = r.drop_id;
    END IF;

    INSERT INTO _mres VALUES (r.keep_id, r.keep_name, r.drop_id, r.drop_name, r.phone, v_moved, v_removed);
  END LOOP;

  RETURN QUERY SELECT * FROM _mres;
END;
$$;

REVOKE ALL ON FUNCTION public.repair_contact_phones(uuid, boolean, integer) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.repair_contact_names(uuid, boolean, integer) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.merge_duplicate_contacts(uuid, boolean) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.repair_contact_phones(uuid, boolean, integer) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.repair_contact_names(uuid, boolean, integer) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.merge_duplicate_contacts(uuid, boolean) TO authenticated, service_role;