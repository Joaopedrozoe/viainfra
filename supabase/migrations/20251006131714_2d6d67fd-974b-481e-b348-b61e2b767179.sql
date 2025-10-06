-- Habilitar realtime para a tabela messages
-- Necessário para que o widget receba mensagens dos atendentes em tempo real

-- Garantir que temos REPLICA IDENTITY FULL para capturar todas as mudanças
ALTER TABLE public.messages REPLICA IDENTITY FULL;

-- Adicionar a tabela à publicação do realtime (se ainda não estiver)
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;