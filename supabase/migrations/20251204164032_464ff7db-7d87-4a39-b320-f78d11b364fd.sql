-- Adicionar coluna bot_enabled na tabela whatsapp_instances
ALTER TABLE public.whatsapp_instances 
ADD COLUMN IF NOT EXISTS bot_enabled boolean DEFAULT true;