CREATE TABLE public.broadcast_runs (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), company_id uuid NOT NULL REFERENCES public.companies(id), created_by uuid NOT NULL, template_name text NOT NULL, language text NOT NULL, body_preview text NOT NULL DEFAULT '', image_url text NOT NULL, variables jsonb NOT NULL DEFAULT '[]', status text NOT NULL DEFAULT 'draft', is_test boolean NOT NULL DEFAULT false, created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now());
GRANT SELECT ON public.broadcast_runs TO authenticated; GRANT ALL ON public.broadcast_runs TO service_role;
ALTER TABLE public.broadcast_runs ENABLE ROW LEVEL SECURITY;
CREATE POLICY broadcast_runs_read ON public.broadcast_runs FOR SELECT TO authenticated USING(company_id IN (SELECT public.get_user_company_ids(auth.uid())));
CREATE TRIGGER broadcast_runs_updated BEFORE UPDATE ON public.broadcast_runs FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TABLE public.broadcast_recipients (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), run_id uuid NOT NULL REFERENCES public.broadcast_runs(id) ON DELETE CASCADE, company_id uuid NOT NULL REFERENCES public.companies(id), phone text NOT NULL, status text NOT NULL DEFAULT 'queued', message_id text, conversation_id uuid, error text, claimed_at timestamptz, created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(), UNIQUE(run_id,phone));
GRANT SELECT ON public.broadcast_recipients TO authenticated; GRANT ALL ON public.broadcast_recipients TO service_role;
ALTER TABLE public.broadcast_recipients ENABLE ROW LEVEL SECURITY;
CREATE POLICY broadcast_recipients_read ON public.broadcast_recipients FOR SELECT TO authenticated USING(company_id IN (SELECT public.get_user_company_ids(auth.uid())));
CREATE INDEX broadcast_recipients_pending ON public.broadcast_recipients(run_id,status);
CREATE TRIGGER broadcast_recipients_updated BEFORE UPDATE ON public.broadcast_recipients FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE FUNCTION public.claim_broadcast_recipients(p_run uuid) RETURNS SETOF public.broadcast_recipients LANGUAGE sql SECURITY DEFINER SET search_path=public AS $$ UPDATE public.broadcast_recipients SET status='processing',claimed_at=now() WHERE id IN(SELECT r.id FROM public.broadcast_recipients r JOIN public.broadcast_runs b ON b.id=r.run_id WHERE r.run_id=p_run AND r.status='queued' AND b.status='running' ORDER BY r.created_at LIMIT 5 FOR UPDATE OF r SKIP LOCKED) RETURNING * $$;
REVOKE ALL ON FUNCTION public.claim_broadcast_recipients(uuid) FROM PUBLIC,anon,authenticated; GRANT EXECUTE ON FUNCTION public.claim_broadcast_recipients(uuid) TO service_role;
CREATE TABLE public.contact_name_history (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), company_id uuid NOT NULL, contact_id uuid NOT NULL, previous_name text NOT NULL, new_name text NOT NULL, changed_by uuid, created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now());
GRANT SELECT ON public.contact_name_history TO authenticated; GRANT ALL ON public.contact_name_history TO service_role;
ALTER TABLE public.contact_name_history ENABLE ROW LEVEL SECURITY;
CREATE POLICY contact_name_history_read ON public.contact_name_history FOR SELECT TO authenticated USING(company_id IN (SELECT public.get_user_company_ids(auth.uid())));
CREATE FUNCTION public.preserve_contact_custom_name() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$ BEGIN
IF NEW.company_id <> 'e3ad9c68-cf12-4e39-a12d-3f3068e975a0'::uuid THEN RETURN NEW; END IF;
IF NEW.name IS DISTINCT FROM OLD.name THEN
IF auth.uid() IS NULL AND OLD.name IS NOT NULL AND btrim(OLD.name) NOT IN ('','Sem Nome','Contato','Desconhecido') AND OLD.name !~ '^[0-9+ @.]+$' AND OLD.name !~ '@(lid|s.whatsapp.net|c.us)$' THEN NEW.name := OLD.name;
ELSE INSERT INTO public.contact_name_history(company_id,contact_id,previous_name,new_name,changed_by) VALUES(OLD.company_id,OLD.id,OLD.name,NEW.name,auth.uid());
IF auth.uid() IS NOT NULL THEN NEW.metadata := coalesce(NEW.metadata,'{}'::jsonb)||jsonb_build_object('custom_name',NEW.name,'name_source','manual'); END IF;
END IF; END IF; RETURN NEW; END $$;
CREATE TRIGGER preserve_contact_custom_name BEFORE UPDATE OF name ON public.contacts FOR EACH ROW EXECUTE FUNCTION public.preserve_contact_custom_name();