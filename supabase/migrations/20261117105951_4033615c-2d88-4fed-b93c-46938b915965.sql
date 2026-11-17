CREATE TABLE public.backup_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','running','finalizing','complete','incomplete','failed','cancelled')),
  trigger_type text NOT NULL DEFAULT 'manual' CHECK (trigger_type IN ('manual','scheduled')),
  requested_by uuid,
  snapshot_at timestamptz,
  started_at timestamptz,
  finished_at timestamptz,
  items_total integer NOT NULL DEFAULT 0 CHECK (items_total >= 0),
  items_verified integer NOT NULL DEFAULT 0 CHECK (items_verified >= 0),
  items_failed integer NOT NULL DEFAULT 0 CHECK (items_failed >= 0),
  bytes_total bigint NOT NULL DEFAULT 0 CHECK (bytes_total >= 0),
  manifest_sha256 text CHECK (manifest_sha256 IS NULL OR manifest_sha256 ~ '^[0-9a-f]{64}$'),
  receiver_confirmed_at timestamptz,
  last_error text CHECK (last_error IS NULL OR length(last_error) <= 2000),
  stage text,
  progress jsonb NOT NULL DEFAULT '{}'::jsonb,
  occurrence_key text,
  step_lock_until timestamptz,
  restore_tested_at timestamptz,
  restore_result text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT backup_runs_finished_after_started CHECK (finished_at IS NULL OR started_at IS NULL OR finished_at >= started_at),
  CONSTRAINT backup_runs_complete_requires_confirmation CHECK (status <> 'complete' OR (receiver_confirmed_at IS NOT NULL AND manifest_sha256 IS NOT NULL))
);

CREATE TABLE public.backup_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  run_id uuid NOT NULL REFERENCES public.backup_runs(id) ON DELETE CASCADE,
  component text NOT NULL CHECK (component IN ('db_schema','db_data','storage','functions','source','manifest')),
  item_key text NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','uploading','uploaded','verified','failed','skipped')),
  size_bytes bigint NOT NULL DEFAULT 0 CHECK (size_bytes >= 0),
  sha256_expected text CHECK (sha256_expected IS NULL OR sha256_expected ~ '^[0-9a-f]{64}$'),
  sha256_received text CHECK (sha256_received IS NULL OR sha256_received ~ '^[0-9a-f]{64}$'),
  row_count bigint CHECK (row_count IS NULL OR row_count >= 0),
  attempts integer NOT NULL DEFAULT 0 CHECK (attempts BETWEEN 0 AND 10),
  last_error text CHECK (last_error IS NULL OR length(last_error) <= 2000),
  last_attempt_at timestamptz,
  verified_at timestamptz,
  metadata jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT backup_items_run_key_unique UNIQUE (run_id, item_key),
  CONSTRAINT backup_items_item_key_check CHECK (item_key ~ '^[a-z0-9._/-]+$' AND length(item_key) BETWEEN 1 AND 512 AND position('..' in item_key) = 0 AND left(item_key,1) <> '/'),
  CONSTRAINT backup_items_verified_hash_match CHECK (status <> 'verified' OR (sha256_expected IS NOT NULL AND sha256_received = sha256_expected))
);

CREATE INDEX backup_runs_status_created_idx ON public.backup_runs (status, created_at DESC);
CREATE INDEX backup_items_run_status_idx ON public.backup_items (run_id, status);
CREATE INDEX backup_items_run_component_idx ON public.backup_items (run_id, component);
CREATE UNIQUE INDEX backup_runs_one_active ON public.backup_runs ((true)) WHERE status IN ('pending','running','finalizing');

GRANT SELECT ON public.backup_runs TO authenticated;
GRANT SELECT ON public.backup_items TO authenticated;
GRANT ALL ON public.backup_runs TO service_role;
GRANT ALL ON public.backup_items TO service_role;
ALTER TABLE public.backup_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.backup_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can view backup runs" ON public.backup_runs FOR SELECT TO authenticated USING (public.is_admin(auth.uid()));
CREATE POLICY "Admins can view backup items" ON public.backup_items FOR SELECT TO authenticated USING (public.is_admin(auth.uid()));
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.backup_runs FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.backup_items FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.backup_internal_config (key text PRIMARY KEY, value text NOT NULL);
GRANT ALL ON public.backup_internal_config TO service_role;
ALTER TABLE public.backup_internal_config ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.backup_schedules (
  id integer PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  enabled boolean NOT NULL DEFAULT false,
  frequency text NOT NULL DEFAULT 'daily' CHECK (frequency IN ('daily','weekly','monthly')),
  time_of_day time NOT NULL DEFAULT '03:00',
  weekday integer CHECK (weekday BETWEEN 0 AND 6),
  month_day integer CHECK (month_day BETWEEN 1 AND 28),
  timezone text NOT NULL DEFAULT 'America/Sao_Paulo',
  cron_expression_utc text,
  next_run_at timestamptz,
  updated_by uuid,
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.backup_schedules TO authenticated;
GRANT ALL ON public.backup_schedules TO service_role;
ALTER TABLE public.backup_schedules ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins view backup schedule" ON public.backup_schedules FOR SELECT TO authenticated USING (public.is_admin(auth.uid()));

CREATE TABLE public.backup_schedule_occurrences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  occurrence_key text NOT NULL UNIQUE,
  scheduled_for timestamptz NOT NULL,
  attempts integer NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','running','complete','failed','skipped_concurrency','missed')),
  run_id uuid,
  last_error text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.backup_schedule_occurrences TO authenticated;
GRANT ALL ON public.backup_schedule_occurrences TO service_role;
ALTER TABLE public.backup_schedule_occurrences ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins view backup occurrences" ON public.backup_schedule_occurrences FOR SELECT TO authenticated USING (public.is_admin(auth.uid()));

CREATE TABLE public.backup_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actor uuid,
  action text NOT NULL,
  details jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.backup_events TO authenticated;
GRANT ALL ON public.backup_events TO service_role;
ALTER TABLE public.backup_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins view backup events" ON public.backup_events FOR SELECT TO authenticated USING (public.is_admin(auth.uid()));

CREATE OR REPLACE FUNCTION public.backup_schema_catalog()
RETURNS jsonb LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'pg_catalog', 'public' AS $fn$
SELECT jsonb_build_object(
  'generated_at', now(),
  'server_version', current_setting('server_version'),
  'extensions', (SELECT coalesce(jsonb_agg(jsonb_build_object('name', e.extname, 'version', e.extversion, 'schema', n.nspname) ORDER BY e.extname), '[]')
                 FROM pg_extension e JOIN pg_namespace n ON n.oid = e.extnamespace),
  'enums', (SELECT coalesce(jsonb_agg(jsonb_build_object('name', t.typname, 'values',
              (SELECT jsonb_agg(en.enumlabel ORDER BY en.enumsortorder) FROM pg_enum en WHERE en.enumtypid = t.oid)) ORDER BY t.typname), '[]')
            FROM pg_type t JOIN pg_namespace n ON n.oid = t.typnamespace WHERE n.nspname = 'public' AND t.typtype = 'e'),
  'sequences', (SELECT coalesce(jsonb_agg(jsonb_build_object('name', c.relname, 'definition',
                 format('CREATE SEQUENCE IF NOT EXISTS public.%I AS %s INCREMENT %s MINVALUE %s MAXVALUE %s START %s%s;',
                   c.relname, format_type(s.seqtypid, NULL), s.seqincrement, s.seqmin, s.seqmax, s.seqstart, CASE WHEN s.seqcycle THEN ' CYCLE' ELSE '' END)) ORDER BY c.relname), '[]')
                FROM pg_sequence s JOIN pg_class c ON c.oid = s.seqrelid JOIN pg_namespace n ON n.oid = c.relnamespace WHERE n.nspname = 'public'),
  'tables', (SELECT coalesce(jsonb_agg(jsonb_build_object(
      'name', c.relname, 'rls_enabled', c.relrowsecurity, 'rls_forced', c.relforcerowsecurity,
      'comment', obj_description(c.oid, 'pg_class'),
      'columns', (SELECT jsonb_agg(jsonb_build_object('name', a.attname, 'type', format_type(a.atttypid, a.atttypmod), 'not_null', a.attnotnull,
            'default', pg_get_expr(d.adbin, d.adrelid), 'identity', nullif(a.attidentity, ''), 'generated', nullif(a.attgenerated, '')) ORDER BY a.attnum)
          FROM pg_attribute a LEFT JOIN pg_attrdef d ON d.adrelid = a.attrelid AND d.adnum = a.attnum
          WHERE a.attrelid = c.oid AND a.attnum > 0 AND NOT a.attisdropped),
      'constraints', (SELECT coalesce(jsonb_agg(jsonb_build_object('name', co.conname, 'type', co.contype, 'definition', pg_get_constraintdef(co.oid),
            'references', CASE WHEN co.confrelid <> 0 THEN co.confrelid::regclass::text END) ORDER BY co.contype, co.conname), '[]')
          FROM pg_constraint co WHERE co.conrelid = c.oid),
      'indexes', (SELECT coalesce(jsonb_agg(jsonb_build_object('name', i.relname, 'definition', pg_get_indexdef(x.indexrelid),
            'is_constraint', EXISTS (SELECT 1 FROM pg_constraint k WHERE k.conindid = x.indexrelid)) ORDER BY i.relname), '[]')
          FROM pg_index x JOIN pg_class i ON i.oid = x.indexrelid WHERE x.indrelid = c.oid)
    ) ORDER BY c.relname), '[]')
    FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace WHERE n.nspname = 'public' AND c.relkind IN ('r','p')),
  'views', (SELECT coalesce(jsonb_agg(jsonb_build_object('name', c.relname, 'kind', c.relkind, 'definition', pg_get_viewdef(c.oid, true)) ORDER BY c.relname), '[]')
            FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace WHERE n.nspname = 'public' AND c.relkind IN ('v','m')),
  'functions', (SELECT coalesce(jsonb_agg(jsonb_build_object('name', p.proname, 'identity_args', pg_get_function_identity_arguments(p.oid),
                 'security_definer', p.prosecdef, 'definition', pg_get_functiondef(p.oid)) ORDER BY p.proname, pg_get_function_identity_arguments(p.oid)), '[]')
                FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
                WHERE n.nspname = 'public' AND p.prokind IN ('f','p')
                  AND NOT EXISTS (SELECT 1 FROM pg_depend dp WHERE dp.objid = p.oid AND dp.deptype = 'e')),
  'triggers', (SELECT coalesce(jsonb_agg(jsonb_build_object('name', t.tgname, 'table', t.tgrelid::regclass::text, 'enabled', t.tgenabled,
                'definition', pg_get_triggerdef(t.oid)) ORDER BY t.tgrelid::regclass::text, t.tgname), '[]')
               FROM pg_trigger t JOIN pg_class c ON c.oid = t.tgrelid JOIN pg_namespace n ON n.oid = c.relnamespace
               WHERE NOT t.tgisinternal AND (n.nspname = 'public' OR (n.nspname = 'auth' AND c.relname = 'users'))),
  'policies', (SELECT coalesce(jsonb_agg(jsonb_build_object('schema', schemaname, 'table', tablename, 'name', policyname, 'permissive', permissive,
                'roles', roles, 'command', cmd, 'using', qual, 'with_check', with_check) ORDER BY schemaname, tablename, policyname), '[]')
               FROM pg_policies WHERE schemaname IN ('public', 'storage')),
  'table_grants', (SELECT coalesce(jsonb_agg(jsonb_build_object('table', table_name, 'grantee', grantee, 'privilege', privilege_type) ORDER BY table_name, grantee, privilege_type), '[]')
                   FROM information_schema.role_table_grants WHERE table_schema = 'public' AND grantee IN ('anon', 'authenticated', 'service_role')),
  'function_grants', (SELECT coalesce(jsonb_agg(jsonb_build_object('function', routine_name, 'grantee', grantee, 'privilege', privilege_type) ORDER BY routine_name, grantee), '[]')
                      FROM information_schema.role_routine_grants WHERE routine_schema = 'public' AND grantee IN ('anon', 'authenticated', 'service_role', 'PUBLIC')),
  'storage_buckets', (SELECT coalesce(jsonb_agg(jsonb_build_object('id', b.id, 'public', b.public, 'file_size_limit', b.file_size_limit,
                       'allowed_mime_types', b.allowed_mime_types) ORDER BY b.id), '[]') FROM storage.buckets b),
  'realtime_publication_tables', (SELECT coalesce(jsonb_agg(jsonb_build_object('schema', schemaname, 'table', tablename) ORDER BY tablename), '[]')
                                  FROM pg_publication_tables WHERE pubname = 'supabase_realtime')
);
$fn$;
REVOKE ALL ON FUNCTION public.backup_schema_catalog() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.backup_schema_catalog() TO service_role;

CREATE OR REPLACE FUNCTION public.backup_compute_next_run(_freq text, _time time, _weekday int, _month_day int, _from timestamptz DEFAULT now())
RETURNS timestamptz LANGUAGE plpgsql STABLE SET search_path = public AS $$
DECLARE _local timestamp := _from AT TIME ZONE 'America/Sao_Paulo'; _d date; _cand timestamp;
BEGIN
  FOR i IN 0..62 LOOP
    _d := _local::date + i;
    _cand := _d + _time;
    IF _cand > _local AND (
      _freq = 'daily'
      OR (_freq = 'weekly' AND extract(dow FROM _d)::int = _weekday)
      OR (_freq = 'monthly' AND extract(day FROM _d)::int = _month_day)
    ) THEN RETURN _cand AT TIME ZONE 'America/Sao_Paulo'; END IF;
  END LOOP;
  RETURN NULL;
END $$;

CREATE OR REPLACE FUNCTION public.backup_cron_command(_body jsonb)
RETURNS text LANGUAGE sql IMMUTABLE SET search_path = public AS $$
  SELECT format($c$select net.http_post(
    url := (select value from public.backup_internal_config where key = 'function_url'),
    headers := jsonb_build_object('Content-Type','application/json',
      'apikey', (select value from public.backup_internal_config where key = 'anon_key'),
      'x-backup-internal', (select value from public.backup_internal_config where key = 'internal_key')),
    body := %L::jsonb || jsonb_build_object('fired_at', now()),
    timeout_milliseconds := 30000)$c$, _body::text)
$$;

CREATE OR REPLACE FUNCTION public.apply_backup_schedule(_enabled boolean, _frequency text, _time time, _weekday int, _month_day int)
RETURNS public.backup_schedules LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, cron AS $$
DECLARE _utc timestamp; _shift int; _expr text; _row public.backup_schedules;
BEGIN
  IF NOT public.is_admin(auth.uid()) THEN RAISE EXCEPTION 'forbidden'; END IF;
  IF _frequency NOT IN ('daily','weekly','monthly') THEN RAISE EXCEPTION 'frequência inválida'; END IF;
  IF _frequency = 'weekly' AND (_weekday IS NULL OR _weekday NOT BETWEEN 0 AND 6) THEN RAISE EXCEPTION 'dia da semana inválido'; END IF;
  IF _frequency = 'monthly' AND (_month_day IS NULL OR _month_day NOT BETWEEN 1 AND 28) THEN RAISE EXCEPTION 'dia do mês deve ser de 1 a 28'; END IF;
  _utc := ((current_date + _time) AT TIME ZONE 'America/Sao_Paulo') AT TIME ZONE 'UTC';
  _shift := _utc::date - current_date;
  IF _frequency = 'monthly' AND _month_day + _shift > 28 THEN
    RAISE EXCEPTION 'dia 28 após 21h não é suportado (cairia no dia 29 em UTC)';
  END IF;
  _expr := extract(minute FROM _utc)::int || ' ' || extract(hour FROM _utc)::int || ' ' ||
    CASE _frequency
      WHEN 'daily' THEN '* * *'
      WHEN 'weekly' THEN '* * ' || ((_weekday + _shift + 7) % 7)
      ELSE (_month_day + _shift) || ' * *' END;
  IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'backup-scheduled') THEN
    PERFORM cron.unschedule('backup-scheduled');
  END IF;
  IF _enabled THEN
    PERFORM cron.schedule('backup-scheduled', _expr, public.backup_cron_command(jsonb_build_object('mode','scheduled_run')));
  END IF;
  INSERT INTO public.backup_schedules AS s (id, enabled, frequency, time_of_day, weekday, month_day, cron_expression_utc, next_run_at, updated_by, updated_at)
  VALUES (1, _enabled, _frequency, _time,
    CASE WHEN _frequency='weekly' THEN _weekday END, CASE WHEN _frequency='monthly' THEN _month_day END,
    CASE WHEN _enabled THEN _expr END,
    CASE WHEN _enabled THEN public.backup_compute_next_run(_frequency, _time, _weekday, _month_day) END,
    auth.uid(), now())
  ON CONFLICT (id) DO UPDATE SET enabled = EXCLUDED.enabled, frequency = EXCLUDED.frequency, time_of_day = EXCLUDED.time_of_day,
    weekday = EXCLUDED.weekday, month_day = EXCLUDED.month_day, cron_expression_utc = EXCLUDED.cron_expression_utc,
    next_run_at = EXCLUDED.next_run_at, updated_by = EXCLUDED.updated_by, updated_at = now()
  RETURNING * INTO _row;
  INSERT INTO public.backup_events (actor, action, details)
  VALUES (auth.uid(), 'schedule_updated', jsonb_build_object('enabled',_enabled,'frequency',_frequency,'time',_time,'weekday',_weekday,'month_day',_month_day,'cron_utc',_expr));
  RETURN _row;
END $$;
REVOKE ALL ON FUNCTION public.apply_backup_schedule(boolean,text,time,int,int) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.apply_backup_schedule(boolean,text,time,int,int) TO authenticated;

CREATE OR REPLACE FUNCTION public.backup_schedule_once(_job text, _at timestamptz, _body jsonb)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, cron AS $$
DECLARE _u timestamp := _at AT TIME ZONE 'UTC';
BEGIN
  IF _job !~ '^backup-retry-[a-z0-9]+$' THEN RAISE EXCEPTION 'nome inválido'; END IF;
  IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = _job) THEN PERFORM cron.unschedule(_job); END IF;
  PERFORM cron.schedule(_job,
    extract(minute FROM _u)::int || ' ' || extract(hour FROM _u)::int || ' ' || extract(day FROM _u)::int || ' ' || extract(month FROM _u)::int || ' *',
    public.backup_cron_command(_body || jsonb_build_object('retry_job', _job)));
END $$;
CREATE OR REPLACE FUNCTION public.backup_unschedule_job(_job text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, cron AS $$
BEGIN
  IF _job ~ '^backup-retry-[a-z0-9]+$' AND EXISTS (SELECT 1 FROM cron.job WHERE jobname = _job) THEN PERFORM cron.unschedule(_job); END IF;
END $$;
CREATE OR REPLACE FUNCTION public.backup_cron_jobs()
RETURNS TABLE(jobname text, schedule text, active boolean) LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public, cron AS $$
  SELECT jobname::text, schedule::text, active FROM cron.job WHERE jobname LIKE 'backup-%'
$$;
CREATE OR REPLACE FUNCTION public.backup_cron_history(_limit int DEFAULT 20)
RETURNS TABLE(jobname text, status text, return_message text, start_time timestamptz) LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public, cron AS $$
  SELECT j.jobname::text, d.status, left(d.return_message, 300), d.start_time
  FROM cron.job_run_details d JOIN cron.job j ON j.jobid = d.jobid
  WHERE j.jobname LIKE 'backup-%' ORDER BY d.start_time DESC LIMIT _limit
$$;
CREATE OR REPLACE FUNCTION public.backup_list_storage_objects(_after text, _limit int)
RETURNS TABLE(id uuid, bucket_id text, name text, metadata jsonb, created_at timestamptz, updated_at timestamptz)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public, storage AS $$
  SELECT o.id, o.bucket_id, o.name, o.metadata, o.created_at, o.updated_at FROM storage.objects o
  WHERE (_after IS NULL OR o.id::text > _after) ORDER BY o.id::text LIMIT least(_limit, 1000)
$$;
CREATE OR REPLACE FUNCTION public.backup_table_counts()
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE r record; _n bigint; _out jsonb := '{}'::jsonb;
BEGIN
  FOR r IN SELECT c.relname FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE n.nspname='public' AND c.relkind='r' LOOP
    EXECUTE format('SELECT count(*) FROM public.%I', r.relname) INTO _n;
    _out := _out || jsonb_build_object(r.relname, _n);
  END LOOP;
  RETURN _out;
END $$;
REVOKE ALL ON FUNCTION public.backup_schedule_once(text,timestamptz,jsonb), public.backup_unschedule_job(text),
  public.backup_cron_history(int), public.backup_list_storage_objects(text,int), public.backup_table_counts(),
  public.backup_cron_command(jsonb), public.backup_cron_jobs() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.backup_schedule_once(text,timestamptz,jsonb), public.backup_unschedule_job(text),
  public.backup_cron_history(int), public.backup_list_storage_objects(text,int), public.backup_table_counts(),
  public.backup_cron_jobs() TO service_role;