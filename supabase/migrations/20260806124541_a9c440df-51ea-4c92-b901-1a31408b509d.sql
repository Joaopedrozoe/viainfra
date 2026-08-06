CREATE OR REPLACE FUNCTION public.contacts_audit_summary(_company_id uuid DEFAULT NULL)
RETURNS TABLE(company_id uuid, company_name text, total_contacts integer, missing_phone integer, numeric_names integer, duplicate_phones integer)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT co.id,
         co.name,
         count(c.*)::int,
         count(*) FILTER (WHERE c.phone IS NULL OR c.phone = '')::int,
         count(*) FILTER (WHERE c.name ~ '^[+0-9 ()\-]+$')::int,
         (SELECT coalesce(sum(cnt - 1), 0)::int FROM (
            SELECT count(*) AS cnt FROM public.contacts x
            WHERE x.company_id = co.id AND x.phone IS NOT NULL AND x.phone <> ''
            GROUP BY x.phone HAVING count(*) > 1
          ) d)
  FROM public.companies co
  LEFT JOIN public.contacts c ON c.company_id = co.id
  WHERE (_company_id IS NULL OR co.id = _company_id)
  GROUP BY co.id, co.name
  ORDER BY co.name;
$$;

REVOKE ALL ON FUNCTION public.contacts_audit_summary(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.contacts_audit_summary(uuid) TO authenticated, service_role;