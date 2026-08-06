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
      WHERE v.contact_id = r.keep_id
      ORDER BY (SELECT count(*) FROM public.messages m WHERE m.conversation_id = v.id) DESC
      LIMIT 1;

      IF v_keep_conv IS NULL THEN
        UPDATE public.conversations SET contact_id = r.keep_id WHERE contact_id = r.drop_id;
      ELSE
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

      DELETE FROM public.contacts WHERE id = r.drop_id;
    END IF;

    INSERT INTO _mres VALUES (r.keep_id, r.keep_name, r.drop_id, r.drop_name, r.phone, v_moved, v_removed);
  END LOOP;

  RETURN QUERY SELECT * FROM _mres;
END;
$$;

REVOKE ALL ON FUNCTION public.merge_duplicate_contacts(uuid, boolean) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.merge_duplicate_contacts(uuid, boolean) TO authenticated, service_role;