-- Adicionar coluna bot_active na tabela conversations
ALTER TABLE public.conversations
ADD COLUMN IF NOT EXISTS bot_active boolean DEFAULT true;

-- Comentário explicativo
COMMENT ON COLUMN public.conversations.bot_active IS 'Indica se o bot está ativo para esta conversa. Quando false, apenas atendentes podem responder.';

-- Índice para performance
CREATE INDEX IF NOT EXISTS idx_conversations_bot_active ON public.conversations(bot_active) WHERE bot_active = true;