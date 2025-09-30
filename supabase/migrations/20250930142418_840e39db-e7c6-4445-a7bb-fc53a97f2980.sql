-- Fix user_presence foreign key relationship
-- Drop existing table and recreate with proper foreign key
DROP TABLE IF EXISTS public.user_presence CASCADE;

-- Recreate with explicit foreign key
CREATE TABLE public.user_presence (
  user_id UUID PRIMARY KEY,
  status public.user_status NOT NULL DEFAULT 'offline',
  last_seen TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  custom_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  CONSTRAINT fk_user_presence_profiles 
    FOREIGN KEY (user_id) 
    REFERENCES auth.users(id) 
    ON DELETE CASCADE
);

-- Enable RLS
ALTER TABLE public.user_presence ENABLE ROW LEVEL SECURITY;

-- Policies para user_presence
CREATE POLICY "Users can view all user presence in their company"
ON public.user_presence
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM profiles p1
    WHERE p1.user_id = user_presence.user_id
    AND p1.company_id IN (
      SELECT p2.company_id FROM profiles p2 WHERE p2.user_id = auth.uid()
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

-- Trigger para atualizar updated_at
CREATE TRIGGER update_user_presence_updated_at
BEFORE UPDATE ON public.user_presence
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Adicionar publicação realtime
ALTER PUBLICATION supabase_realtime ADD TABLE user_presence;

-- Criar índices para performance
CREATE INDEX idx_user_presence_status ON user_presence(status);
CREATE INDEX idx_user_presence_user_id ON user_presence(user_id);