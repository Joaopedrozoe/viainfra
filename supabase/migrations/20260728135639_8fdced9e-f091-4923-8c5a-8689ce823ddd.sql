DROP POLICY IF EXISTS "Users can create import jobs for their company" ON public.import_jobs;
DROP POLICY IF EXISTS "Users can update their company import jobs" ON public.import_jobs;
DROP POLICY IF EXISTS "Users can view their company import jobs" ON public.import_jobs;

CREATE POLICY "Users can create import jobs for their companies"
ON public.import_jobs FOR INSERT TO authenticated
WITH CHECK (
  company_id IN (SELECT public.get_user_company_ids(auth.uid()))
  OR EXISTS (SELECT 1 FROM public.company_access ca WHERE ca.user_id = auth.uid() AND ca.company_id = import_jobs.company_id)
);

CREATE POLICY "Users can view their companies import jobs"
ON public.import_jobs FOR SELECT TO authenticated
USING (
  company_id IN (SELECT public.get_user_company_ids(auth.uid()))
  OR EXISTS (SELECT 1 FROM public.company_access ca WHERE ca.user_id = auth.uid() AND ca.company_id = import_jobs.company_id)
);

CREATE POLICY "Users can update their companies import jobs"
ON public.import_jobs FOR UPDATE TO authenticated
USING (
  company_id IN (SELECT public.get_user_company_ids(auth.uid()))
  OR EXISTS (SELECT 1 FROM public.company_access ca WHERE ca.user_id = auth.uid() AND ca.company_id = import_jobs.company_id)
);

GRANT SELECT, INSERT, UPDATE ON public.import_jobs TO authenticated;
GRANT ALL ON public.import_jobs TO service_role;