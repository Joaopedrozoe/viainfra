
CREATE TABLE public.company_access (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, company_id)
);

ALTER TABLE public.company_access ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own company access"
ON public.company_access
FOR SELECT
USING (user_id = auth.uid());

CREATE POLICY "Service role can manage company access"
ON public.company_access
FOR ALL
USING (true)
WITH CHECK (true);

INSERT INTO public.company_access (user_id, company_id)
VALUES 
  ('df98e045-9a6f-461f-990c-cf4d10a77b64', 'e3ad9c68-cf12-4e39-a12d-3f3068e975a0'),
  ('2dbb8e79-666d-4aa2-bea6-ee14aae1350f', 'e3ad9c68-cf12-4e39-a12d-3f3068e975a0');
