
CREATE TABLE IF NOT EXISTS public.calls (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  contact_id UUID REFERENCES public.contacts(id) ON DELETE SET NULL,
  conversation_id UUID REFERENCES public.conversations(id) ON DELETE SET NULL,
  agent_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  wa_call_id TEXT UNIQUE,
  phone TEXT NOT NULL,
  contact_name TEXT,
  direction TEXT NOT NULL CHECK (direction IN ('incoming','outgoing')),
  status TEXT NOT NULL DEFAULT 'ringing' CHECK (status IN ('ringing','connected','completed','missed','declined','failed','no_answer','permission_pending')),
  call_type TEXT NOT NULL DEFAULT 'voice' CHECK (call_type IN ('voice','video')),
  duration INTEGER NOT NULL DEFAULT 0,
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  connected_at TIMESTAMPTZ,
  ended_at TIMESTAMPTZ,
  error TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.calls TO authenticated;
GRANT ALL ON public.calls TO service_role;

ALTER TABLE public.calls ENABLE ROW LEVEL SECURITY;

CREATE POLICY "calls_select_by_company" ON public.calls FOR SELECT TO authenticated
USING (
  company_id IN (SELECT public.get_user_company_ids(auth.uid()))
  OR EXISTS (SELECT 1 FROM public.company_access ca WHERE ca.user_id = auth.uid() AND ca.company_id = calls.company_id)
);

CREATE POLICY "calls_insert_by_company" ON public.calls FOR INSERT TO authenticated
WITH CHECK (
  company_id IN (SELECT public.get_user_company_ids(auth.uid()))
  OR EXISTS (SELECT 1 FROM public.company_access ca WHERE ca.user_id = auth.uid() AND ca.company_id = calls.company_id)
);

CREATE POLICY "calls_update_by_company" ON public.calls FOR UPDATE TO authenticated
USING (
  company_id IN (SELECT public.get_user_company_ids(auth.uid()))
  OR EXISTS (SELECT 1 FROM public.company_access ca WHERE ca.user_id = auth.uid() AND ca.company_id = calls.company_id)
);

CREATE INDEX IF NOT EXISTS idx_calls_company_started ON public.calls(company_id, started_at DESC);
CREATE INDEX IF NOT EXISTS idx_calls_wa_call_id ON public.calls(wa_call_id);

CREATE TRIGGER update_calls_updated_at BEFORE UPDATE ON public.calls
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

ALTER PUBLICATION supabase_realtime ADD TABLE public.calls;
