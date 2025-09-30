-- Criar enum para status de presença
CREATE TYPE public.user_status AS ENUM ('online', 'away', 'busy', 'offline');

-- Criar tabela de presença dos usuários
CREATE TABLE public.user_presence (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  status public.user_status NOT NULL DEFAULT 'offline',
  last_seen TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  custom_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.user_presence ENABLE ROW LEVEL SECURITY;

-- Policies para user_presence
CREATE POLICY "Users can view all user presence in their company"
ON public.user_presence
FOR SELECT
USING (
  user_id IN (
    SELECT p.user_id 
    FROM profiles p
    WHERE p.company_id IN (
      SELECT company_id FROM profiles WHERE user_id = auth.uid()
    )
  )
);

CREATE POLICY "Users can update their own presence"
ON public.user_presence
FOR UPDATE
USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own presence"
ON public.user_presence
FOR INSERT
WITH CHECK (user_id = auth.uid());

-- Criar tabela de conversas internas (chat entre atendentes)
CREATE TABLE public.internal_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
  participants UUID[] NOT NULL, -- Array de user_ids
  title TEXT,
  is_group BOOLEAN NOT NULL DEFAULT false,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.internal_conversations ENABLE ROW LEVEL SECURITY;

-- Policies para internal_conversations
CREATE POLICY "Users can view internal conversations they participate in"
ON public.internal_conversations
FOR SELECT
USING (
  auth.uid() = ANY(participants) AND
  company_id IN (
    SELECT company_id FROM profiles WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Users can create internal conversations in their company"
ON public.internal_conversations
FOR INSERT
WITH CHECK (
  company_id IN (
    SELECT company_id FROM profiles WHERE user_id = auth.uid()
  ) AND
  auth.uid() = ANY(participants)
);

-- Criar tabela de mensagens internas
CREATE TABLE public.internal_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID REFERENCES public.internal_conversations(id) ON DELETE CASCADE,
  sender_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  attachments JSONB DEFAULT '[]'::jsonb,
  read_by UUID[] DEFAULT '{}'::uuid[],
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.internal_messages ENABLE ROW LEVEL SECURITY;

-- Policies para internal_messages
CREATE POLICY "Users can view messages from their internal conversations"
ON public.internal_messages
FOR SELECT
USING (
  conversation_id IN (
    SELECT id FROM internal_conversations WHERE auth.uid() = ANY(participants)
  )
);

CREATE POLICY "Users can send messages to their internal conversations"
ON public.internal_messages
FOR INSERT
WITH CHECK (
  conversation_id IN (
    SELECT id FROM internal_conversations WHERE auth.uid() = ANY(participants)
  ) AND
  sender_id = auth.uid()
);

-- Trigger para atualizar updated_at em user_presence
CREATE TRIGGER update_user_presence_updated_at
BEFORE UPDATE ON public.user_presence
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Trigger para atualizar updated_at em internal_conversations
CREATE TRIGGER update_internal_conversations_updated_at
BEFORE UPDATE ON public.internal_conversations
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Adicionar publicação realtime para presença
ALTER PUBLICATION supabase_realtime ADD TABLE user_presence;
ALTER PUBLICATION supabase_realtime ADD TABLE internal_conversations;
ALTER PUBLICATION supabase_realtime ADD TABLE internal_messages;

-- Criar índices para performance
CREATE INDEX idx_user_presence_status ON user_presence(status);
CREATE INDEX idx_internal_conversations_participants ON internal_conversations USING GIN(participants);
CREATE INDEX idx_internal_messages_conversation ON internal_messages(conversation_id);
CREATE INDEX idx_internal_messages_sender ON internal_messages(sender_id);
