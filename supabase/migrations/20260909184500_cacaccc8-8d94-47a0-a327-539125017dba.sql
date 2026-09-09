CREATE TABLE IF NOT EXISTS public.conversation_reads (
  conversation_id uuid NOT NULL PRIMARY KEY REFERENCES public.conversations(id) ON DELETE CASCADE,
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  last_read_at timestamp with time zone NOT NULL DEFAULT now(),
  last_read_by uuid,
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_conversation_reads_company ON public.conversation_reads(company_id);

GRANT SELECT, INSERT, UPDATE ON public.conversation_reads TO authenticated;
GRANT ALL ON public.conversation_reads TO service_role;

ALTER TABLE public.conversation_reads ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "company members can view conversation reads" ON public.conversation_reads;
CREATE POLICY "company members can view conversation reads"
ON public.conversation_reads FOR SELECT TO authenticated
USING (company_id IN (SELECT public.get_user_company_ids(auth.uid())));

DROP POLICY IF EXISTS "company members can insert conversation reads" ON public.conversation_reads;
CREATE POLICY "company members can insert conversation reads"
ON public.conversation_reads FOR INSERT TO authenticated
WITH CHECK (company_id IN (SELECT public.get_user_company_ids(auth.uid())));

DROP POLICY IF EXISTS "company members can update conversation reads" ON public.conversation_reads;
CREATE POLICY "company members can update conversation reads"
ON public.conversation_reads FOR UPDATE TO authenticated
USING (company_id IN (SELECT public.get_user_company_ids(auth.uid())))
WITH CHECK (company_id IN (SELECT public.get_user_company_ids(auth.uid())));

DROP TRIGGER IF EXISTS trg_conversation_reads_updated_at ON public.conversation_reads;
CREATE TRIGGER trg_conversation_reads_updated_at
BEFORE UPDATE ON public.conversation_reads
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

ALTER PUBLICATION supabase_realtime ADD TABLE public.conversation_reads;