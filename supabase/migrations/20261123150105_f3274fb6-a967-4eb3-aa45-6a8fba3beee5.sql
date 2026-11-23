ALTER FUNCTION public.has_announcement_admin(uuid) SECURITY INVOKER;
ALTER FUNCTION public.publish_company_announcement(uuid,uuid) SECURITY INVOKER;
CREATE INDEX user_roles_company_id_idx ON public.user_roles(company_id);