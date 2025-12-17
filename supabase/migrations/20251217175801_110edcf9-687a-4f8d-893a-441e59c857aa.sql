-- Tabela para configurações SMTP por empresa
CREATE TABLE public.smtp_settings (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  smtp_host text NOT NULL,
  smtp_port integer NOT NULL DEFAULT 587,
  smtp_user text NOT NULL,
  smtp_password text NOT NULL, -- Será encriptado no app
  smtp_security text NOT NULL DEFAULT 'TLS',
  from_email text NOT NULL,
  from_name text,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(company_id)
);

-- Enable RLS
ALTER TABLE public.smtp_settings ENABLE ROW LEVEL SECURITY;

-- Políticas RLS
CREATE POLICY "Users can view smtp settings from their company"
ON public.smtp_settings FOR SELECT
USING (company_id IN (SELECT company_id FROM profiles WHERE user_id = auth.uid()));

CREATE POLICY "Admins can insert smtp settings"
ON public.smtp_settings FOR INSERT
WITH CHECK (company_id IN (SELECT company_id FROM profiles WHERE user_id = auth.uid() AND role = 'admin'));

CREATE POLICY "Admins can update smtp settings"
ON public.smtp_settings FOR UPDATE
USING (company_id IN (SELECT company_id FROM profiles WHERE user_id = auth.uid() AND role = 'admin'));

CREATE POLICY "Service role can manage smtp settings"
ON public.smtp_settings FOR ALL
USING (true)
WITH CHECK (true);

-- Trigger para updated_at
CREATE TRIGGER update_smtp_settings_updated_at
BEFORE UPDATE ON public.smtp_settings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();