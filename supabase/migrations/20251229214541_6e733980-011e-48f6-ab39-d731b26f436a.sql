
-- Atualizar updated_at da conversa do Yago para garantir que apareça no topo
UPDATE conversations 
SET updated_at = now()
WHERE id = 'fd52c009-c3f6-4933-8e06-92bc10dc0e32';
