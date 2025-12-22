-- Deletar mensagens e conversas de status@broadcast (Stories)
DELETE FROM messages WHERE conversation_id IN (
  SELECT id FROM conversations WHERE metadata->>'remoteJid' = 'status@broadcast'
);

DELETE FROM conversations WHERE metadata->>'remoteJid' = 'status@broadcast';

-- Deletar contatos de status@broadcast órfãos
DELETE FROM contacts 
WHERE metadata->>'remoteJid' = 'status@broadcast' 
AND id NOT IN (SELECT contact_id FROM conversations WHERE contact_id IS NOT NULL);

-- Criar tabela para armazenar Status do WhatsApp
CREATE TABLE IF NOT EXISTS public.whatsapp_statuses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
  contact_id UUID REFERENCES public.contacts(id) ON DELETE CASCADE,
  instance_name TEXT NOT NULL,
  remote_jid TEXT NOT NULL,
  message_id TEXT,
  content_type TEXT NOT NULL DEFAULT 'text',
  content TEXT,
  media_url TEXT,
  thumbnail_base64 TEXT,
  caption TEXT,
  background_color TEXT,
  viewed BOOLEAN DEFAULT false,
  viewed_at TIMESTAMP WITH TIME ZONE,
  expires_at TIMESTAMP WITH TIME ZONE,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.whatsapp_statuses ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view statuses from their company" 
ON public.whatsapp_statuses 
FOR SELECT 
USING (company_id IN (SELECT company_id FROM profiles WHERE user_id = auth.uid()));

CREATE POLICY "Service role can manage statuses" 
ON public.whatsapp_statuses 
FOR ALL 
USING (true) 
WITH CHECK (true);

-- Create index for efficient queries
CREATE INDEX idx_whatsapp_statuses_company ON public.whatsapp_statuses(company_id);
CREATE INDEX idx_whatsapp_statuses_contact ON public.whatsapp_statuses(contact_id);
CREATE INDEX idx_whatsapp_statuses_created ON public.whatsapp_statuses(created_at DESC);
CREATE INDEX idx_whatsapp_statuses_expires ON public.whatsapp_statuses(expires_at);

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE whatsapp_statuses;