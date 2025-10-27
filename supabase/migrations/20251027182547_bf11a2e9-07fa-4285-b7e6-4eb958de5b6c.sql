-- Criar tabela para gerenciar instâncias WhatsApp da Evolution API
CREATE TABLE IF NOT EXISTS public.whatsapp_instances (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
  instance_name TEXT NOT NULL UNIQUE,
  phone_number TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  qr_code TEXT,
  webhook_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  connection_state TEXT,
  last_sync TIMESTAMP WITH TIME ZONE
);

-- Enable RLS
ALTER TABLE public.whatsapp_instances ENABLE ROW LEVEL SECURITY;

-- Policies para whatsapp_instances
CREATE POLICY "Users can view instances from their company" 
ON public.whatsapp_instances 
FOR SELECT 
USING (company_id IN (
  SELECT company_id FROM profiles WHERE user_id = auth.uid()
));

CREATE POLICY "Users can insert instances to their company" 
ON public.whatsapp_instances 
FOR INSERT 
WITH CHECK (company_id IN (
  SELECT company_id FROM profiles WHERE user_id = auth.uid()
));

CREATE POLICY "Users can update instances from their company" 
ON public.whatsapp_instances 
FOR UPDATE 
USING (company_id IN (
  SELECT company_id FROM profiles WHERE user_id = auth.uid()
));

CREATE POLICY "Users can delete instances from their company" 
ON public.whatsapp_instances 
FOR DELETE 
USING (company_id IN (
  SELECT company_id FROM profiles WHERE user_id = auth.uid()
));

-- Permitir acesso público para webhook (service role)
CREATE POLICY "Allow service role to manage whatsapp instances" 
ON public.whatsapp_instances 
FOR ALL 
USING (true)
WITH CHECK (true);

-- Criar índices para melhor performance
CREATE INDEX idx_whatsapp_instances_company_id ON public.whatsapp_instances(company_id);
CREATE INDEX idx_whatsapp_instances_instance_name ON public.whatsapp_instances(instance_name);
CREATE INDEX idx_whatsapp_instances_status ON public.whatsapp_instances(status);