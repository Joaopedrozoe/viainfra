CREATE TABLE IF NOT EXISTS public.message_reactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  message_id UUID NOT NULL REFERENCES public.messages(id) ON DELETE CASCADE,
  conversation_id UUID REFERENCES public.conversations(id) ON DELETE CASCADE,
  emoji TEXT NOT NULL,
  reactor_type TEXT NOT NULL DEFAULT 'user',
  reactor_id UUID,
  reactor_name TEXT,
  external_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS message_reactions_unique_reactor
  ON public.message_reactions (message_id, reactor_type, COALESCE(reactor_id::text, 'external'));
CREATE INDEX IF NOT EXISTS message_reactions_conversation_idx
  ON public.message_reactions (conversation_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.message_reactions TO authenticated;
GRANT ALL ON public.message_reactions TO service_role;

ALTER TABLE public.message_reactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view reactions from their company conversations"
ON public.message_reactions FOR SELECT TO authenticated
USING (conversation_id IN (
  SELECT c.id FROM public.conversations c
  WHERE c.company_id IN (SELECT p.company_id FROM public.profiles p WHERE p.user_id = auth.uid())
     OR c.company_id IN (SELECT ca.company_id FROM public.company_access ca WHERE ca.user_id = auth.uid())
));

CREATE POLICY "Users can add reactions to their company conversations"
ON public.message_reactions FOR INSERT TO authenticated
WITH CHECK (conversation_id IN (
  SELECT c.id FROM public.conversations c
  WHERE c.company_id IN (SELECT p.company_id FROM public.profiles p WHERE p.user_id = auth.uid())
     OR c.company_id IN (SELECT ca.company_id FROM public.company_access ca WHERE ca.user_id = auth.uid())
));

CREATE POLICY "Users can update their own reactions"
ON public.message_reactions FOR UPDATE TO authenticated
USING (reactor_id = auth.uid());

CREATE POLICY "Users can delete their own reactions"
ON public.message_reactions FOR DELETE TO authenticated
USING (reactor_id = auth.uid());

CREATE POLICY "Service role manages reactions"
ON public.message_reactions FOR ALL TO service_role
USING (true) WITH CHECK (true);

CREATE TRIGGER update_message_reactions_updated_at
BEFORE UPDATE ON public.message_reactions
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

ALTER PUBLICATION supabase_realtime ADD TABLE public.message_reactions;