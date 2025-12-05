
-- Adicionar apenas conversations se ainda não estiver
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'conversations'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE conversations;
  END IF;
END $$;

-- Habilitar REPLICA IDENTITY FULL
ALTER TABLE conversations REPLICA IDENTITY FULL;
