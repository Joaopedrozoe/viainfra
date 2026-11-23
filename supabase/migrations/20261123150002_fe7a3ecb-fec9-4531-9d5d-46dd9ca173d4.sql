CREATE TABLE public.user_roles (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
 company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
 role text NOT NULL DEFAULT 'announcement_admin',
 created_at timestamptz NOT NULL DEFAULT now(),
 UNIQUE(user_id, company_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Read own announcement roles" ON public.user_roles FOR SELECT TO authenticated USING (user_id = auth.uid());
INSERT INTO public.user_roles (user_id, company_id, role)
SELECT DISTINCT p.user_id, p.company_id, 'announcement_admin' FROM public.profiles p JOIN auth.users u ON u.id=p.user_id WHERE p.role='admin' AND p.company_id IS NOT NULL ON CONFLICT DO NOTHING;
CREATE FUNCTION public.has_announcement_admin(_company_id uuid) RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
 SELECT EXISTS(SELECT 1 FROM public.user_roles WHERE user_id=auth.uid() AND company_id=_company_id AND role='announcement_admin');
$$;
REVOKE ALL ON FUNCTION public.has_announcement_admin(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.has_announcement_admin(uuid) TO authenticated, service_role;
CREATE TABLE public.company_announcements (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
 title text NOT NULL,
 summary text NOT NULL,
 details text NOT NULL DEFAULT '',
 release_version text NOT NULL DEFAULT '',
 kind text NOT NULL DEFAULT 'update',
 status text NOT NULL DEFAULT 'draft',
 dismissible boolean NOT NULL DEFAULT true,
 published_at timestamptz,
 created_at timestamptz NOT NULL DEFAULT now(),
 updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.company_announcements TO authenticated;
GRANT ALL ON public.company_announcements TO service_role;
ALTER TABLE public.company_announcements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Company members read published announcements" ON public.company_announcements FOR SELECT TO authenticated USING (
 company_id IN (SELECT public.get_user_company_ids(auth.uid())) AND (status='published' OR public.has_announcement_admin(company_id))
);
CREATE POLICY "Company announcement admins create drafts" ON public.company_announcements FOR INSERT TO authenticated WITH CHECK (
 public.has_announcement_admin(company_id) AND status='draft'
);
CREATE POLICY "Company announcement admins update" ON public.company_announcements FOR UPDATE TO authenticated USING (public.has_announcement_admin(company_id)) WITH CHECK (public.has_announcement_admin(company_id));
CREATE POLICY "Company announcement admins delete unpublished" ON public.company_announcements FOR DELETE TO authenticated USING (public.has_announcement_admin(company_id) AND status <> 'published');
CREATE UNIQUE INDEX company_announcements_one_published ON public.company_announcements(company_id) WHERE status='published';
CREATE INDEX company_announcements_company_created ON public.company_announcements(company_id, created_at DESC);
CREATE FUNCTION public.validate_company_announcement() RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
 IF TG_OP='UPDATE' AND NEW.company_id IS DISTINCT FROM OLD.company_id THEN RAISE EXCEPTION 'A empresa do aviso não pode ser alterada'; END IF;
 IF NEW.kind NOT IN ('update','alert','incident','info') THEN RAISE EXCEPTION 'Tipo de aviso inválido'; END IF;
 IF NEW.status NOT IN ('draft','published','archived') THEN RAISE EXCEPTION 'Estado de publicação inválido'; END IF;
 IF length(trim(NEW.title))=0 OR length(NEW.title)>120 THEN RAISE EXCEPTION 'Título obrigatório, com até 120 caracteres'; END IF;
 IF length(trim(NEW.summary))=0 OR length(NEW.summary)>280 THEN RAISE EXCEPTION 'Resumo obrigatório, com até 280 caracteres'; END IF;
 IF length(NEW.details)>10000 OR length(NEW.release_version)>40 THEN RAISE EXCEPTION 'Detalhes ou versão excedem o limite'; END IF;
 NEW.updated_at=clock_timestamp();
 IF NEW.status='published' AND NEW.published_at IS NULL THEN NEW.published_at=clock_timestamp(); END IF;
 RETURN NEW;
END;
$$;
CREATE TRIGGER validate_company_announcement BEFORE INSERT OR UPDATE ON public.company_announcements FOR EACH ROW EXECUTE FUNCTION public.validate_company_announcement();
CREATE FUNCTION public.publish_company_announcement(_announcement_id uuid, _company_id uuid) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
 IF NOT public.has_announcement_admin(_company_id) THEN RAISE EXCEPTION 'Acesso restrito a administradores da empresa' USING ERRCODE='42501'; END IF;
 PERFORM pg_advisory_xact_lock(hashtextextended(_company_id::text,0));
 IF NOT EXISTS(SELECT 1 FROM public.company_announcements WHERE id=_announcement_id AND company_id=_company_id) THEN RAISE EXCEPTION 'Aviso não encontrado'; END IF;
 UPDATE public.company_announcements SET status='archived' WHERE company_id=_company_id AND status='published' AND id<>_announcement_id;
 UPDATE public.company_announcements SET status='published', published_at=clock_timestamp() WHERE id=_announcement_id AND company_id=_company_id;
END;
$$;
REVOKE ALL ON FUNCTION public.publish_company_announcement(uuid,uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.publish_company_announcement(uuid,uuid) TO authenticated;
ALTER PUBLICATION supabase_realtime ADD TABLE public.company_announcements;