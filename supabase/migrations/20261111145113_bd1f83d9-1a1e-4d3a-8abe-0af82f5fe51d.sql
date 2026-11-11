ALTER TABLE public.broadcast_runs ADD COLUMN request_id uuid UNIQUE, ADD COLUMN worker_until timestamptz;
CREATE OR REPLACE FUNCTION public.claim_broadcast_recipients(p_run uuid) RETURNS SETOF public.broadcast_recipients LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$ BEGIN
UPDATE public.broadcast_runs SET worker_until=now()+interval '3 minutes' WHERE id=p_run AND status='running' AND (worker_until IS NULL OR worker_until<now());
IF NOT FOUND THEN RETURN; END IF;
RETURN QUERY UPDATE public.broadcast_recipients SET status='processing',claimed_at=now() WHERE id IN(SELECT r.id FROM public.broadcast_recipients r WHERE r.run_id=p_run AND r.status='queued' ORDER BY r.created_at LIMIT 5 FOR UPDATE SKIP LOCKED) RETURNING *;
END $$;
REVOKE ALL ON FUNCTION public.claim_broadcast_recipients(uuid) FROM PUBLIC,anon,authenticated; GRANT EXECUTE ON FUNCTION public.claim_broadcast_recipients(uuid) TO service_role;