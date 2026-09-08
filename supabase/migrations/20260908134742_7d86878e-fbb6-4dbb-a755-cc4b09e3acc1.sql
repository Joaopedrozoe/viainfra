-- lovable-cron-fallback-reviewed: 288 runs/day; approved plan requires continuous inbox analysis with max 5 min delay; processor batches pending jobs and exits immediately when the queue is empty
CREATE OR REPLACE FUNCTION public.get_user_company_ids(_user_id uuid)
 RETURNS SETOF uuid
 LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $$
  SELECT company_id FROM public.profiles WHERE user_id = _user_id AND company_id IS NOT NULL
  UNION
  SELECT company_id FROM public.company_access WHERE user_id = _user_id;
$$;

DROP POLICY IF EXISTS "Users can view contacts from their company" ON public.contacts;
DROP POLICY IF EXISTS "Users can insert contacts to their company" ON public.contacts;
DROP POLICY IF EXISTS "Users can update contacts from their company" ON public.contacts;
DROP POLICY IF EXISTS "Users can delete contacts from their company" ON public.contacts;
CREATE POLICY "Users can view contacts from their company" ON public.contacts FOR SELECT TO authenticated
  USING (company_id IN (SELECT public.get_user_company_ids(auth.uid())));
CREATE POLICY "Users can insert contacts to their company" ON public.contacts FOR INSERT TO authenticated
  WITH CHECK (company_id IN (SELECT public.get_user_company_ids(auth.uid())));
CREATE POLICY "Users can update contacts from their company" ON public.contacts FOR UPDATE TO authenticated
  USING (company_id IN (SELECT public.get_user_company_ids(auth.uid())))
  WITH CHECK (company_id IN (SELECT public.get_user_company_ids(auth.uid())));
CREATE POLICY "Users can delete contacts from their company" ON public.contacts FOR DELETE TO authenticated
  USING (company_id IN (SELECT public.get_user_company_ids(auth.uid())));

DROP POLICY IF EXISTS "Users can insert conversations to their company" ON public.conversations;
CREATE POLICY "Users can insert conversations to their company" ON public.conversations FOR INSERT TO authenticated
  WITH CHECK (company_id IN (SELECT public.get_user_company_ids(auth.uid())));

ALTER TABLE public.calls
  ADD COLUMN IF NOT EXISTS answered_by uuid,
  ADD COLUMN IF NOT EXISTS answered_by_name text,
  ADD COLUMN IF NOT EXISTS ring_deadline timestamptz;

CREATE OR REPLACE FUNCTION public.claim_call(_call_id uuid, _action text)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_name text;
  v_row public.calls%ROWTYPE;
BEGIN
  IF v_uid IS NULL THEN RAISE EXCEPTION 'not authenticated'; END IF;
  SELECT name INTO v_name FROM public.profiles WHERE user_id = v_uid LIMIT 1;

  SELECT * INTO v_row FROM public.calls WHERE id = _call_id FOR UPDATE;
  IF NOT FOUND THEN RETURN jsonb_build_object('ok', false, 'reason', 'not_found'); END IF;
  IF v_row.company_id NOT IN (SELECT public.get_user_company_ids(v_uid)) THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'forbidden');
  END IF;
  IF v_row.answered_by IS NOT NULL AND v_row.answered_by <> v_uid THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'already_claimed', 'answered_by', v_row.answered_by, 'answered_by_name', v_row.answered_by_name);
  END IF;
  IF v_row.status NOT IN ('ringing','permission_pending') AND v_row.answered_by IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'not_ringing', 'status', v_row.status);
  END IF;

  UPDATE public.calls SET
    answered_by = v_uid,
    answered_by_name = v_name,
    agent_id = v_uid,
    status = CASE WHEN _action = 'reject' THEN 'rejected' ELSE status END,
    ended_at = CASE WHEN _action = 'reject' THEN now() ELSE ended_at END,
    updated_at = now()
  WHERE id = _call_id;

  RETURN jsonb_build_object('ok', true, 'answered_by', v_uid, 'answered_by_name', v_name);
END;
$$;
GRANT EXECUTE ON FUNCTION public.claim_call(uuid, text) TO authenticated;

CREATE TABLE IF NOT EXISTS public.ai_agents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  name text NOT NULL DEFAULT 'Vivi',
  avatar_url text,
  primary_color text NOT NULL DEFAULT '#F5B301',
  secondary_color text NOT NULL DEFAULT '#4B4B4B',
  tone text NOT NULL DEFAULT 'acolhedora, ágil, confiável e focada em soluções',
  personality text NOT NULL DEFAULT 'Assistente de atendimento acolhedora, ágil, transparente, organizada e focada no cliente. Frase típica: "Pode deixar comigo!"',
  mode text NOT NULL DEFAULT 'learning',
  status text NOT NULL DEFAULT 'active',
  continuous_enabled boolean NOT NULL DEFAULT true,
  continuous_interval_minutes integer NOT NULL DEFAULT 5,
  backfill_status text NOT NULL DEFAULT 'idle',
  backfill_total integer NOT NULL DEFAULT 0,
  backfill_processed integer NOT NULL DEFAULT 0,
  backfill_cursor timestamptz,
  last_run_at timestamptz,
  last_error text,
  daily_requests integer NOT NULL DEFAULT 0,
  daily_requests_date date NOT NULL DEFAULT CURRENT_DATE,
  daily_request_limit integer NOT NULL DEFAULT 1400,
  config jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (company_id)
);
GRANT SELECT, UPDATE ON public.ai_agents TO authenticated;
GRANT ALL ON public.ai_agents TO service_role;
ALTER TABLE public.ai_agents ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ai_agents_select_company" ON public.ai_agents FOR SELECT TO authenticated
  USING (company_id IN (SELECT public.get_user_company_ids(auth.uid())));
CREATE POLICY "ai_agents_update_company" ON public.ai_agents FOR UPDATE TO authenticated
  USING (company_id IN (SELECT public.get_user_company_ids(auth.uid())))
  WITH CHECK (company_id IN (SELECT public.get_user_company_ids(auth.uid())));
CREATE TRIGGER ai_agents_updated_at BEFORE UPDATE ON public.ai_agents FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE IF NOT EXISTS public.ai_insights (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  agent_id uuid REFERENCES public.ai_agents(id) ON DELETE CASCADE,
  conversation_id uuid REFERENCES public.conversations(id) ON DELETE CASCADE,
  insight_type text NOT NULL,
  title text NOT NULL,
  summary text NOT NULL,
  sentiment text,
  department text,
  topics text[] NOT NULL DEFAULT '{}',
  score numeric,
  data jsonb NOT NULL DEFAULT '{}'::jsonb,
  source_message_count integer NOT NULL DEFAULT 0,
  analyzed_until timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS ai_insights_company_created_idx ON public.ai_insights (company_id, created_at DESC);
CREATE INDEX IF NOT EXISTS ai_insights_conversation_idx ON public.ai_insights (conversation_id);
GRANT SELECT ON public.ai_insights TO authenticated;
GRANT ALL ON public.ai_insights TO service_role;
ALTER TABLE public.ai_insights ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ai_insights_select_company" ON public.ai_insights FOR SELECT TO authenticated
  USING (company_id IN (SELECT public.get_user_company_ids(auth.uid())));
CREATE TRIGGER ai_insights_updated_at BEFORE UPDATE ON public.ai_insights FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE IF NOT EXISTS public.ai_learning_jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  agent_id uuid REFERENCES public.ai_agents(id) ON DELETE CASCADE,
  conversation_id uuid REFERENCES public.conversations(id) ON DELETE CASCADE,
  job_type text NOT NULL DEFAULT 'continuous',
  status text NOT NULL DEFAULT 'pending',
  attempts integer NOT NULL DEFAULT 0,
  error text,
  scheduled_at timestamptz NOT NULL DEFAULT now(),
  started_at timestamptz,
  finished_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS ai_learning_jobs_status_idx ON public.ai_learning_jobs (company_id, status, scheduled_at);
CREATE UNIQUE INDEX IF NOT EXISTS ai_learning_jobs_pending_unique ON public.ai_learning_jobs (conversation_id) WHERE status = 'pending';
GRANT SELECT ON public.ai_learning_jobs TO authenticated;
GRANT ALL ON public.ai_learning_jobs TO service_role;
ALTER TABLE public.ai_learning_jobs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ai_learning_jobs_select_company" ON public.ai_learning_jobs FOR SELECT TO authenticated
  USING (company_id IN (SELECT public.get_user_company_ids(auth.uid())));
CREATE TRIGGER ai_learning_jobs_updated_at BEFORE UPDATE ON public.ai_learning_jobs FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE FUNCTION public.enqueue_ai_learning_job()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $$
DECLARE v_company uuid; v_agent uuid;
BEGIN
  SELECT c.company_id INTO v_company FROM public.conversations c WHERE c.id = NEW.conversation_id;
  IF v_company IS NULL THEN RETURN NEW; END IF;
  SELECT a.id INTO v_agent FROM public.ai_agents a WHERE a.company_id = v_company AND a.status = 'active' AND a.continuous_enabled;
  IF v_agent IS NULL THEN RETURN NEW; END IF;
  INSERT INTO public.ai_learning_jobs (company_id, agent_id, conversation_id, job_type, status)
  VALUES (v_company, v_agent, NEW.conversation_id, 'continuous', 'pending')
  ON CONFLICT DO NOTHING;
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS messages_enqueue_ai_learning ON public.messages;
CREATE TRIGGER messages_enqueue_ai_learning AFTER INSERT ON public.messages FOR EACH ROW EXECUTE FUNCTION public.enqueue_ai_learning_job();

INSERT INTO public.ai_agents (company_id, name, primary_color, secondary_color)
SELECT id, 'Vivi',
  CASE WHEN lower(name) LIKE '%vialog%' THEN '#F5B301' ELSE '#1E8E3E' END,
  CASE WHEN lower(name) LIKE '%vialog%' THEN '#4B4B4B' ELSE '#0F3D2E' END
FROM public.companies
ON CONFLICT (company_id) DO NOTHING;

SELECT cron.unschedule(jobid) FROM cron.job WHERE jobname = 'vivi-process-queue';
SELECT cron.schedule('vivi-process-queue', '*/5 * * * *', $cron$
  SELECT net.http_post(
    url := 'https://xxojpfhnkxpbznbmhmua.supabase.co/functions/v1/vivi-analyze-conversation',
    headers := '{"Content-Type":"application/json","apikey":"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh4b2pwZmhua3hwYnpuYm1obXVhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkyMzY4NTUsImV4cCI6MjA3NDgxMjg1NX0.K7pqFCShUgQWJgrHThPynEguIkS0_TjIOuKXvIEgNR4"}'::jsonb,
    body := '{"mode":"queue","limit":20}'::jsonb
  );
$cron$);