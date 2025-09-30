-- Adicionar política para permitir visualização pública de conversas web
CREATE POLICY "Allow public to view web conversations"
ON public.conversations
FOR SELECT
USING (channel = 'web');

-- Adicionar política para permitir visualização pública de mensagens de conversas web
CREATE POLICY "Allow public to view web conversation messages"
ON public.messages
FOR SELECT
USING (
  conversation_id IN (
    SELECT id FROM public.conversations WHERE channel = 'web'
  )
);