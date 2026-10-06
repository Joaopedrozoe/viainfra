
DROP POLICY IF EXISTS "Allow service role to manage bots" ON public.bots;
CREATE POLICY "Service role manages bots" ON public.bots FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Members manage company bots" ON public.bots FOR ALL TO authenticated
  USING (company_id IN (SELECT public.get_user_company_ids(auth.uid())))
  WITH CHECK (company_id IN (SELECT public.get_user_company_ids(auth.uid())));

DROP POLICY IF EXISTS "Allow service role to manage whatsapp instances" ON public.whatsapp_instances;
CREATE POLICY "Service role manages instances" ON public.whatsapp_instances FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Members manage company instances" ON public.whatsapp_instances FOR ALL TO authenticated
  USING (company_id IN (SELECT public.get_user_company_ids(auth.uid())))
  WITH CHECK (company_id IN (SELECT public.get_user_company_ids(auth.uid())));

DROP POLICY IF EXISTS "Service role can manage lid mappings" ON public.lid_phone_mapping;
CREATE POLICY "Service role manages lid mappings" ON public.lid_phone_mapping FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Members view company lid mappings" ON public.lid_phone_mapping FOR SELECT TO authenticated
  USING (company_id IN (SELECT public.get_user_company_ids(auth.uid())));

DROP POLICY IF EXISTS "Service role can manage smtp settings" ON public.smtp_settings;
CREATE POLICY "Service role manages smtp settings" ON public.smtp_settings FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Members view company smtp settings" ON public.smtp_settings FOR SELECT TO authenticated
  USING (company_id IN (SELECT public.get_user_company_ids(auth.uid())));
CREATE POLICY "Admins manage company smtp settings" ON public.smtp_settings FOR ALL TO authenticated
  USING (public.is_admin(auth.uid()) AND company_id IN (SELECT public.get_user_company_ids(auth.uid())))
  WITH CHECK (public.is_admin(auth.uid()) AND company_id IN (SELECT public.get_user_company_ids(auth.uid())));

DROP POLICY IF EXISTS "Service role can manage company access" ON public.company_access;
CREATE POLICY "Service role manages company access" ON public.company_access FOR ALL TO service_role USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Service role can manage statuses" ON public.whatsapp_statuses;
CREATE POLICY "Service role manages statuses" ON public.whatsapp_statuses FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Members view company statuses" ON public.whatsapp_statuses FOR SELECT TO authenticated
  USING (company_id IN (SELECT public.get_user_company_ids(auth.uid())));
CREATE POLICY "Members mark company statuses viewed" ON public.whatsapp_statuses FOR UPDATE TO authenticated
  USING (company_id IN (SELECT public.get_user_company_ids(auth.uid())))
  WITH CHECK (company_id IN (SELECT public.get_user_company_ids(auth.uid())));

DROP POLICY IF EXISTS "Service can manage typing status" ON public.typing_status;
DROP POLICY IF EXISTS "Users can view typing status" ON public.typing_status;
CREATE POLICY "Service role manages typing status" ON public.typing_status FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Members view company typing status" ON public.typing_status FOR SELECT TO authenticated
  USING (conversation_id IN (SELECT c.id FROM public.conversations c WHERE c.company_id IN (SELECT public.get_user_company_ids(auth.uid()))));

DROP POLICY IF EXISTS "Authenticated can read contact directory" ON public.contact_directory;
CREATE POLICY "Members read company contact directory" ON public.contact_directory FOR SELECT TO authenticated
  USING (company_id IS NULL OR company_id IN (SELECT public.get_user_company_ids(auth.uid())));
