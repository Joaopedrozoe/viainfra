-- ETAPA 1: Adicionar coluna channels na tabela bots
-- Esta coluna armazenará os canais onde cada bot está ativo

ALTER TABLE public.bots 
ADD COLUMN IF NOT EXISTS channels TEXT[] DEFAULT '{}';

-- Adicionar comentário para documentação
COMMENT ON COLUMN public.bots.channels IS 'Canais onde o bot está ativo (whatsapp, web, instagram, telegram, email)';

-- Adicionar índice para melhorar performance em consultas por canal
CREATE INDEX IF NOT EXISTS idx_bots_channels ON public.bots USING GIN(channels);