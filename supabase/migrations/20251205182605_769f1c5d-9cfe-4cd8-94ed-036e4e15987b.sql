
-- 1. Tabela de fila de mensagens para retry automático
CREATE TABLE IF NOT EXISTS public.message_queue (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id UUID REFERENCES public.conversations(id) ON DELETE CASCADE,
  contact_phone TEXT NOT NULL,
  instance_name TEXT NOT NULL,
  content TEXT NOT NULL,
  message_type TEXT DEFAULT 'text',
  media_url TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'sending', 'sent', 'failed')),
  retry_count INTEGER DEFAULT 0,
  max_retries INTEGER DEFAULT 3,
  error_message TEXT,
  scheduled_at TIMESTAMPTZ DEFAULT now(),
  sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Index para processar fila eficientemente
CREATE INDEX IF NOT EXISTS idx_message_queue_status ON message_queue(status, scheduled_at);
CREATE INDEX IF NOT EXISTS idx_message_queue_conversation ON message_queue(conversation_id);

-- Enable RLS
ALTER TABLE public.message_queue ENABLE ROW LEVEL SECURITY;

-- Política: usuários autenticados podem ver mensagens da fila da sua empresa
CREATE POLICY "Users can view message queue" ON public.message_queue
  FOR SELECT
  USING (
    conversation_id IN (
      SELECT c.id FROM conversations c
      JOIN profiles p ON p.company_id = c.company_id
      WHERE p.user_id = auth.uid()
    )
  );

-- 2. Tabela de status de digitação (typing indicator)
CREATE TABLE IF NOT EXISTS public.typing_status (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id UUID REFERENCES public.conversations(id) ON DELETE CASCADE,
  contact_id UUID REFERENCES public.contacts(id) ON DELETE CASCADE,
  is_typing BOOLEAN DEFAULT false,
  updated_at TIMESTAMPTZ DEFAULT now(),
  expires_at TIMESTAMPTZ DEFAULT (now() + interval '10 seconds'),
  UNIQUE(conversation_id, contact_id)
);

-- Index para performance
CREATE INDEX IF NOT EXISTS idx_typing_status_conv ON typing_status(conversation_id);
CREATE INDEX IF NOT EXISTS idx_typing_status_expires ON typing_status(expires_at);

-- Enable RLS
ALTER TABLE public.typing_status ENABLE ROW LEVEL SECURITY;

-- Política: usuários autenticados podem ver status de digitação
CREATE POLICY "Users can view typing status" ON public.typing_status
  FOR SELECT USING (true);

-- Permitir insert/update do service role (webhook)
CREATE POLICY "Service can manage typing status" ON public.typing_status
  FOR ALL USING (true) WITH CHECK (true);

-- Função para limpar typing status expirados
CREATE OR REPLACE FUNCTION cleanup_expired_typing_status()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM typing_status WHERE expires_at < now();
END;
$$;

-- Trigger para atualizar updated_at na message_queue
CREATE TRIGGER update_message_queue_updated_at
BEFORE UPDATE ON public.message_queue
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Enable realtime for typing_status
ALTER PUBLICATION supabase_realtime ADD TABLE typing_status;
