CREATE POLICY "Users can view companies via company_access"
  ON public.companies FOR SELECT
  USING (
    id IN (
      SELECT company_id FROM public.company_access
      WHERE user_id = auth.uid()
    )
  );