
-- Tabela para mapeamento LID -> telefone real
-- Isso permite que quando uma mensagem @lid chegar, possamos vincular ao contato correto
CREATE TABLE IF NOT EXISTS public.lid_phone_mapping (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  lid TEXT NOT NULL,
  phone TEXT NOT NULL,
  contact_id UUID REFERENCES public.contacts(id) ON DELETE CASCADE,
  company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
  instance_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(lid, company_id)
);

-- Enable RLS
ALTER TABLE public.lid_phone_mapping ENABLE ROW LEVEL SECURITY;

-- Políticas RLS
CREATE POLICY "Service role can manage lid mappings"
ON public.lid_phone_mapping FOR ALL
USING (true)
WITH CHECK (true);

CREATE POLICY "Users can view lid mappings from their company"
ON public.lid_phone_mapping FOR SELECT
USING (company_id IN (SELECT company_id FROM profiles WHERE user_id = auth.uid()));

-- Índices para busca rápida
CREATE INDEX IF NOT EXISTS idx_lid_phone_mapping_lid ON public.lid_phone_mapping(lid);
CREATE INDEX IF NOT EXISTS idx_lid_phone_mapping_phone ON public.lid_phone_mapping(phone);
CREATE INDEX IF NOT EXISTS idx_lid_phone_mapping_company ON public.lid_phone_mapping(company_id);

-- Trigger para atualizar updated_at
CREATE TRIGGER update_lid_phone_mapping_updated_at
BEFORE UPDATE ON public.lid_phone_mapping
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Corrigir o caso específico do Flavio: consolidar conversas
-- Primeiro, mover as mensagens da conversa @lid para a conversa original

-- Verificar as mensagens da conversa duplicada @lid
-- Conversation ID @lid: ef695de8-23d9-45c5-9174-2a98d8b6d985
-- Conversation ID original: 7d35a181-f1ef-4c50-9ce1-18e1c37170da

-- Mover mensagens para a conversa original
UPDATE messages 
SET conversation_id = '7d35a181-f1ef-4c50-9ce1-18e1c37170da'
WHERE conversation_id = 'ef695de8-23d9-45c5-9174-2a98d8b6d985';

-- Deletar a conversa duplicada
DELETE FROM conversations 
WHERE id = 'ef695de8-23d9-45c5-9174-2a98d8b6d985';

-- Deletar o contato @lid duplicado (já que foi criado erroneamente)
DELETE FROM contacts 
WHERE id = 'a8e09c27-809a-42ab-99f8-750f890fc11c';

-- Inserir mapeamento do LID para o telefone correto
INSERT INTO lid_phone_mapping (lid, phone, contact_id, company_id, instance_name)
VALUES (
  '37486625607885', 
  '5511941003586', 
  '227c1726-3935-4f2b-a67d-8668dfbb2469',
  'da17735c-5a76-4797-b338-f6e63a7b3f8b',
  'VIAINFRAOFICIAL'
)
ON CONFLICT (lid, company_id) DO NOTHING;
